"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { ambilModel } from "@/lib/ai/model";
import { getDemoUser } from "@/server/demo-user";
import { dayKey, hariKe, keDueAt, tambahHari, jamKey } from "@/lib/waktu";
import { cekRateLimit } from "@/lib/rate-limit";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// ==================== VALIDASI TANGGAL DAN JAM ====================
const tanggalValid = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal deadline wajib diisi.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Tanggal kalender tidak valid.");

const jamValid = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Format jam harus HH:mm.")
  .refine((value) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }, "Jam harus berada antara 00:00 dan 23:59.");

const kategoriValid = z.enum(["Kuliah", "Organisasi", "Pribadi"]);

// ==================== SKEMA SIMPAN TUGAS ====================
const skema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  judul: z
    .string()
    .trim()
    .min(1, "Nama tugas wajib diisi.")
    .max(120, "Nama maksimal 120 karakter."),
  catatan: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional(),
  // URL berasal dari endpoint upload privat. Kepemilikan blob harus tetap
  // dijaga oleh endpoint upload/download, bukan dipercaya dari FormData.
  attachmentUrl: z.string().max(2048).optional().or(z.literal("")),
  attachmentName: z.string().max(255).optional().or(z.literal("")),
  tanggal: tanggalValid,
  jam: jamValid,
  kategori: kategoriValid,
  estimasi: z.coerce
    .number()
    .min(0.5, "Estimasi minimal 0,5 jam.")
    .max(40, "Estimasi maksimal 40 jam."),
  prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export type HasilForm = { ok: boolean; error?: string };

export async function simpanTugas(
  _prev: HasilForm,
  formData: FormData,
): Promise<HasilForm> {
  const baca = skema.safeParse({
    id: formData.get("id") || undefined,
    judul: String(formData.get("judul") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
    attachmentUrl: String(formData.get("attachmentUrl") ?? ""),
    attachmentName: String(formData.get("attachmentName") ?? ""),
    tanggal: String(formData.get("tanggal") ?? ""),
    jam: String(formData.get("jam") ?? ""),
    kategori: String(formData.get("kategori") ?? ""),
    estimasi: formData.get("estimasi"),
    prioritas: formData.get("prioritas") || undefined,
  });

  if (!baca.success) {
    return {
      ok: false,
      error: baca.error.issues[0]?.message ?? "Data tugas tidak valid.",
    };
  }

  const user = await getDemoUser();
  if (!user) {
    return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
  }

  const data = baca.data;
  const dueAt = keDueAt(data.tanggal, data.jam);

  if (!Number.isFinite(dueAt.getTime())) {
    return { ok: false, error: "Tanggal atau jam deadline tidak valid." };
  }

  const estimateMin = Math.round(data.estimasi * 60);
  const notesValue = data.catatan?.trim() || null;
  const attachmentUrlValue = data.attachmentUrl || null;
  const attachmentNameValue = data.attachmentName || null;

  try {
    if (data.id) {
      const existing = await db.task.findFirst({
        where: {
          id: data.id,
          userId: user.id,
          parentId: null,
        },
        select: {
          attachmentUrl: true,
          dueAt: true,
        },
      });

      if (!existing) {
        return { ok: false, error: "Tugas tidak ditemukan." };
      }

      const deadlineBerubah = existing.dueAt?.getTime() !== dueAt.getTime();

      const updated = await db.task.updateMany({
        where: {
          id: data.id,
          userId: user.id,
          parentId: null,
        },
        data: {
          title: data.judul,
          notes: notesValue,
          attachmentUrl: attachmentUrlValue,
          attachmentName: attachmentNameValue,
          dueAt,
          category: data.kategori,
          estimateMin,
          ...(data.prioritas ? { priority: data.prioritas } : {}),
          ...(deadlineBerubah
            ? {
                notif24hSent: false,
                notif3hSent: false,
                notifOverdueSent: false,
              }
            : {}),
        },
      });

      if (updated.count !== 1) {
        return {
          ok: false,
          error: "Tugas gagal diperbarui. Muat ulang halaman.",
        };
      }

      // Hapus file lama hanya setelah database berhasil menunjuk file baru.
      if (
        existing.attachmentUrl &&
        existing.attachmentUrl !== attachmentUrlValue
      ) {
        try {
          await del(existing.attachmentUrl);
        } catch (error) {
          // Kegagalan membersihkan blob lama tidak boleh membatalkan penyimpanan tugas.
          console.warn("[blob] Gagal menghapus file lampiran lama:", error);
        }
      }
    } else {
      const jamLagi = (dueAt.getTime() - Date.now()) / 3_600_000;
      const priority =
        data.prioritas ??
        (jamLagi <= 24 ? "HIGH" : jamLagi <= 48 ? "MEDIUM" : "LOW");

      await db.task.create({
        data: {
          userId: user.id,
          title: data.judul,
          notes: notesValue,
          attachmentUrl: attachmentUrlValue,
          attachmentName: attachmentNameValue,
          dueAt,
          category: data.kategori,
          estimateMin,
          priority,
        },
      });
    }
  } catch (error) {
    console.error("[tasks] Gagal menyimpan tugas:", error);
    return {
      ok: false,
      error: "Tugas gagal disimpan. Periksa koneksi lalu coba lagi.",
    };
  }

  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");

  return { ok: true };
}

// ==================== AUTO-FILL AI (HYBRID SYSTEM) ====================
const autoFillSchema = z.object({
  judul: z.string().trim().min(3).max(120),
  tanggal: tanggalValid,
  jam: jamValid,
  kategori: kategoriValid,
  estimasiJam: z.number().min(0.5).max(24),
  prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type HasilAutoFill =
  | { ok: true; data: z.infer<typeof autoFillSchema> }
  | { ok: false; error: string };

type DataAutoFill = z.infer<typeof autoFillSchema>;

// Mendeteksi tanggal kalender eksplisit pada input pengguna.
function teksMemuatTanggalAbsolut(teks: string): boolean {
  const lower = teks.toLowerCase();

  // Contoh: 25/11/2026, 25-11-2026, 2026-11-25
  const formatAngka =
    /\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/.test(
      lower,
    );

  // Contoh: 25 November, 25 November 2026
  const formatBulan =
    /\b\d{1,2}\s+(?:januari|jan|februari|feb|maret|mar|april|apr|mei|juni|jun|juli|jul|agustus|agu|september|sep|oktober|okt|november|nov|desember|des)\b/.test(
      lower,
    );

  return formatAngka || formatBulan;
}

// ==================== SANITIZER JUDUL ====================
function bersihkanJudul(judul: string): string {
  let hasil = judul;

  hasil = hasil.replace(
    /\b(deadline|tenggat|dikumpul|kumpul|dikumpulkan|dikerjakan)\w*\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(?:dalam\s+)?\d+\s*(?:jam|menit|hari|detik)\s*(?:dari\s+sekarang|lagi|kedepan|ke\s*depan)\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(hari\s+ini|malam\s+ini|sore\s+ini|pagi\s+ini|besok\s*(?:pagi|siang|sore|malam)?|lusa\s*(?:pagi|siang|sore|malam)?|minggu\s*depan|pekan\s*depan|mingdep)\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(?:senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad)\s*(?:depan|ini|besok|lusa|pagi|siang|sore|malam)?\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(?:jam|pukul)\s*\d{1,2}(?:[:.]\d{2})?\s*(?:pagi|siang|sore|malam|am|pm)?\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(abis\s+(?:maghrib|isya|subuh|dzuhur|ashar)|subuh|maghrib|isya|tengah\s*malam|nanti\s*malam|nanti\s*sore)\b/gi,
    "",
  );
  hasil = hasil.replace(
    /\b(ini|itu|dong|ya|sih|deh|kok|kan|lah|tuh|nih|aja|saja|banget|bgt|bener|emang|sumpah|jujur|harus|mesti|pasti|wajib)\b/gi,
    "",
  );
  hasil = hasil.replace(/[,;:]+/g, " ");
  hasil = hasil.replace(/\s+/g, " ").trim();
  hasil = hasil.replace(/^(?:untuk|buat|dari|ke|di)\s+/i, "");
  hasil = hasil.replace(/\s+(?:untuk|buat|dari|ke|di)$/i, "");

  if (hasil.length < 3) return judul.trim().slice(0, 120);
  return hasil.charAt(0).toUpperCase() + hasil.slice(1, 120);
}

function selisihHariKalender(dari: string, ke: string): number {
  const awal = Date.parse(`${dari}T00:00:00Z`);
  const akhir = Date.parse(`${ke}T00:00:00Z`);
  return Math.round((akhir - awal) / MILLISECONDS_PER_DAY);
}

function konversiJamKata(
  jamMentah: string,
  menitMentah: string | undefined,
  periode: string | undefined,
): { jam: string; majuHari: number } | null {
  let hour = Number(jamMentah);
  const minute = Number(menitMentah ?? "0");
  const period = periode?.toLowerCase();

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (period) {
    if (hour < 1 || hour > 12) return null;

    if (period === "pagi") {
      if (hour === 12) hour = 0;
    } else if (period === "siang") {
      if (hour < 11) hour += 12;
    } else if (period === "sore") {
      if (hour < 12) hour += 12;
    } else if (period === "malam") {
      if (hour === 12) {
        return { jam: `00:${String(minute).padStart(2, "0")}`, majuHari: 1 };
      }
      if (hour < 12) hour += 12;
    }
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  return {
    jam: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    majuHari: 0,
  };
}

// ==================== LOCAL PARSER (DETERMINISTIC) ====================
function ekstrakKalimatLokal(teksAsli: string): DataAutoFill {
  const lower = teksAsli.toLowerCase();
  const now = new Date();
  const hariIniIso = dayKey(now);

  let offsetHari = 1;
  let jam = "23:59";
  let tanggal = hariIniIso;
  let waktuSpesifikTerdeteksi = false;
  let tanggalDisebut = false;
  let matchJamKata: RegExpMatchArray | null = null;

  const matchMenit = lower.match(
    /\b(?:dalam\s*)?(\d+)\s*menit\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/,
  );
  const matchJamRelatif = lower.match(
    /\b(?:dalam\s*)?(\d+)\s*jam\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/,
  );
  const matchHariRelatif = lower.match(
    /\b(?:dalam\s*)?(\d+)\s*hari\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/,
  );

  if (matchMenit) {
    const menit = Math.min(525_600, Number.parseInt(matchMenit[1], 10));
    const target = new Date(now.getTime() + menit * 60_000);
    tanggal = dayKey(target);
    jam = jamKey(target);
    offsetHari = selisihHariKalender(hariIniIso, tanggal);
    waktuSpesifikTerdeteksi = true;
  } else if (matchJamRelatif) {
    const jamTambahan = Math.min(
      8_760,
      Number.parseInt(matchJamRelatif[1], 10),
    );
    const target = new Date(now.getTime() + jamTambahan * 3_600_000);
    tanggal = dayKey(target);
    jam = jamKey(target);
    offsetHari = selisihHariKalender(hariIniIso, tanggal);
    waktuSpesifikTerdeteksi = true;
  } else if (matchHariRelatif) {
    const hariTambahan = Number.parseInt(matchHariRelatif[1], 10);
    offsetHari = Math.max(0, Math.min(365, hariTambahan));
    tanggal = tambahHari(hariIniIso, offsetHari);
    jam = "23:59";
    waktuSpesifikTerdeteksi = true;

    // Tetap baca jam eksplisit jika pengguna menulis "3 hari lagi jam 9 malam".
    matchJamKata = lower.match(
      /\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/,
    );

    if (matchJamKata) {
      const hasilJam = konversiJamKata(
        matchJamKata[1],
        matchJamKata[2],
        matchJamKata[3],
      );

      if (hasilJam) {
        jam = hasilJam.jam;
        if (hasilJam.majuHari > 0) {
          offsetHari += hasilJam.majuHari;
          tanggal = tambahHari(hariIniIso, offsetHari);
        }
      }
    } else if (/\btengah malam\b/.test(lower)) {
      jam = "00:00";
      offsetHari += 1;
      tanggal = tambahHari(hariIniIso, offsetHari);
    } else if (/\bsubuh\b/.test(lower)) {
      jam = "05:00";
    } else if (/\bpagi\b/.test(lower)) {
      jam = "08:00";
    } else if (/\bsiang\b/.test(lower)) {
      jam = "12:00";
    } else if (/\bsore\b/.test(lower)) {
      jam = "16:00";
    } else if (/\bmaghrib\b/.test(lower)) {
      jam = "18:00";
    } else if (/\bisya\b|\bmalam\b/.test(lower)) {
      jam = "20:00";
    }
  } else {
    if (/\b(hari ini|malam ini|sore ini|pagi ini|sekarang)\b/.test(lower)) {
      offsetHari = 0;
      tanggalDisebut = true;
    } else if (/\blusa\b/.test(lower)) {
      offsetHari = 2;
      tanggalDisebut = true;
    } else if (/\bbesok\b/.test(lower)) {
      offsetHari = 1;
      tanggalDisebut = true;
    } else if (/\b(mingdep|minggu depan|pekan depan)\b/.test(lower)) {
      offsetHari = 7;
      tanggalDisebut = true;
    } else {
      const petaHari: Record<string, number> = {
        minggu: 0,
        ahad: 0,
        senin: 1,
        selasa: 2,
        rabu: 3,
        kamis: 4,
        jumat: 5,
        "jum'at": 5,
        sabtu: 6,
      };

      const hariSekarang = hariKe(hariIniIso);

      for (const [namaHari, indexHari] of Object.entries(petaHari)) {
        const polaHari = new RegExp(`\\b${namaHari}\\b`, "i");
        if (!polaHari.test(lower)) continue;

        const selisih = (indexHari - hariSekarang + 7) % 7;
        offsetHari = selisih === 0 ? 7 : selisih;
        tanggalDisebut = true;
        break;
      }
    }

    tanggal = tambahHari(hariIniIso, offsetHari);

    matchJamKata = lower.match(
      /\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/,
    );

    if (matchJamKata) {
      const hasilJam = konversiJamKata(
        matchJamKata[1],
        matchJamKata[2],
        matchJamKata[3],
      );

      if (hasilJam) {
        jam = hasilJam.jam;
        if (hasilJam.majuHari > 0) {
          // Jika pengguna hanya menyebut "jam 12 malam", artikan sebagai
          // tengah malam terdekat (besok 00:00), bukan lusa.
          const basisHari = tanggalDisebut ? offsetHari : 0;
          offsetHari = basisHari + hasilJam.majuHari;
          tanggal = tambahHari(hariIniIso, offsetHari);
        }
        waktuSpesifikTerdeteksi = true;
      }
    } else if (/\btengah malam\b/.test(lower)) {
      jam = "00:00";
      const basisHari = tanggalDisebut ? offsetHari : 0;
      offsetHari = basisHari + 1;
      tanggal = tambahHari(hariIniIso, offsetHari);
      waktuSpesifikTerdeteksi = true;
    } else if (/\bsubuh\b/.test(lower)) {
      jam = "05:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bpagi\b/.test(lower)) {
      jam = "08:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bsiang\b/.test(lower)) {
      jam = "12:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bsore\b/.test(lower)) {
      jam = "16:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bmaghrib\b/.test(lower)) {
      jam = "18:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bisya\b/.test(lower)) {
      jam = "20:00";
      waktuSpesifikTerdeteksi = true;
    } else if (/\bmalam\b/.test(lower)) {
      jam = "20:00";
      waktuSpesifikTerdeteksi = true;
    }
  }

  // ================= KATEGORI =================
  let kategori: z.infer<typeof kategoriValid> = "Kuliah";

  if (
    /\b(ukm|rapat|panitia|organisasi|hima|bem|divisi|proker|kepanitiaan)\b/.test(
      lower,
    )
  ) {
    kategori = "Organisasi";
  } else if (
    /\b(beli|olahraga|gym|kamar|rumah|pribadi|laundry|jalan|tidur|nonton|main)\b/.test(
      lower,
    )
  ) {
    kategori = "Pribadi";
  }

  // ================= ESTIMASI =================
  let estimasiJam = 2;
  const matchDurasi = lower.match(/(\d+(?:[.,]\d+)?)\s*jam\b/);
  const durasiAdalahWaktuDeadline =
    Boolean(matchJamRelatif?.[0]?.includes(matchDurasi?.[0] ?? "")) ||
    Boolean(matchJamKata?.[0]?.includes(matchDurasi?.[0] ?? ""));

  if (matchDurasi && !durasiAdalahWaktuDeadline) {
    estimasiJam = Math.min(
      12,
      Math.max(0.5, Number.parseFloat(matchDurasi[1].replace(",", "."))),
    );
  } else if (
    /\b(laprak|laporan|makalah|skripsi|project|proyek|coding|proposal|jurnal)\b/.test(
      lower,
    )
  ) {
    estimasiJam = 3;
  } else if (/\b(kuis|uts|uas|ujian|tryout|latihan soal)\b/.test(lower)) {
    estimasiJam = 2;
  } else if (/\b(rangkum|review|baca|baca materi|nonton)\b/.test(lower)) {
    estimasiJam = 1.5;
  }

  // ================= PRIORITAS =================
  let prioritas: "LOW" | "MEDIUM" | "HIGH" =
    offsetHari <= 1 ? "HIGH" : offsetHari <= 3 ? "MEDIUM" : "LOW";

  if (
    /\b(penting|mendesak|urgent|ujian|uts|uas|besok|hari ini|malam ini)\b/.test(
      lower,
    )
  ) {
    prioritas = "HIGH";
  } else if (/\b(santai|gampang|ringan|nanti)\b/.test(lower)) {
    prioritas = "LOW";
  }

  if (waktuSpesifikTerdeteksi && offsetHari === 0) {
    prioritas = "HIGH";
  }

  const judulBersih = bersihkanJudul(teksAsli) || teksAsli.trim();

  return {
    judul: judulBersih.slice(0, 120),
    tanggal,
    jam,
    kategori,
    estimasiJam,
    prioritas,
  };
}

// ==================== AI PARSER ====================
async function cobaParseAI(teks: string): Promise<DataAutoFill | null> {
  const now = new Date();
  const hariIniIso = dayKey(now);
  const besokIso = tambahHari(hariIniIso, 1);

  const sekarangLengkap = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    hourCycle: "h23",
  }).format(now);

  const jamSekarangWIB = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    hourCycle: "h23",
  }).format(now);

  try {
    const infoModel = ambilModel();
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.05,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(12_000),
      system: [
        "Kamu asisten ekstraksi form tugas. Ubah kalimat pengguna menjadi JSON terstruktur.",
        `WAKTU SEKARANG (WIB): ${sekarangLengkap}`,
        `JAM SEKARANG (WIB): ${jamSekarangWIB}`,
        `TANGGAL HARI INI: ${hariIniIso}`,
        `TANGGAL BESOK: ${besokIso}`,
        "ATURAN WAKTU:",
        "- X jam lagi atau dalam X jam: tambahkan X jam dari waktu sekarang.",
        "- X menit lagi: tambahkan X menit dari waktu sekarang.",
        "- X hari lagi: tanggal hari ini + X hari, jam 23:59 WIB.",
        "- jam 9 malam = 21:00; jam 3 sore = 15:00; jam 7 pagi = 07:00.",
        "- jam 12 malam atau tengah malam = 00:00 pada hari berikutnya.",
        "- Jika waktu melewati tengah malam, tanggal harus maju ke hari berikutnya.",
        "ATURAN JUDUL:",
        "- Judul hanya nama tugas, tanpa kata deadline, tenggat, tanggal, jam, atau filler.",
        "- Jangan menghapus kata yang merupakan bagian dari nama tugas.",
        "ATURAN KATEGORI:",
        "- Kuliah adalah kategori default.",
        "- Organisasi untuk UKM, HIMA, BEM, rapat, panitia, atau kegiatan organisasi.",
        "- Pribadi untuk aktivitas pribadi seperti belanja, gym, rumah, atau laundry.",
        "ATURAN ESTIMASI:",
        "- Default 2 jam; laporan/makalah/skripsi 3 jam; kuis/ujian 2 jam.",
        "ATURAN PRIORITAS:",
        "- HIGH untuk deadline dekat atau mendesak; LOW untuk tugas santai; selain itu MEDIUM.",
        "Kembalikan JSON saja tanpa markdown atau teks tambahan.",
        JSON.stringify({
          judul: "Tugas Matematika",
          tanggal: hariIniIso,
          jam: "22:00",
          kategori: "Kuliah",
          estimasiJam: 2,
          prioritas: "HIGH",
        }),
      ].join("\n"),
      prompt: `Kalimat pengguna:\n"""${teks}"""\n\nJSON:`,
    });

    const awal = text.indexOf("{");
    const akhir = text.lastIndexOf("}");
    if (awal === -1 || akhir === -1 || akhir <= awal) return null;

    const parsed = autoFillSchema.safeParse(
      JSON.parse(text.slice(awal, akhir + 1)) as unknown,
    );

    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.warn("[mate] AI gagal, memakai local parser:", error);
    return null;
  }
}

// ==================== MERGE LOGIC (HYBRID) ====================
function mergeHasil(
  lokal: DataAutoFill,
  ai: DataAutoFill | null,
  teksAsli: string,
): DataAutoFill {
  if (!ai) return lokal;

  const tanggalAbsolut = teksMemuatTanggalAbsolut(teksAsli);

  const tanggal = tanggalAbsolut ? ai.tanggal : lokal.tanggal;

  const jamDefault = "23:59";
  const lokalPunyaWaktuSpesifik = lokal.jam !== jamDefault;
  const aiPunyaWaktuSpesifik = ai.jam !== jamDefault;

  // Parser lokal menjadi sumber tanggal utama karena menggunakan WIB.
  // AI hanya membantu mengisi jam jika pengguna belum menyebut jam eksplisit.
  const jam =
    !lokalPunyaWaktuSpesifik && aiPunyaWaktuSpesifik ? ai.jam : lokal.jam;

  const judulAI = bersihkanJudul(ai.judul);
  const judulLokal = bersihkanJudul(lokal.judul);
  const judul =
    judulAI.length >= 3 && judulAI.length > judulLokal.length * 0.7
      ? judulAI
      : judulLokal;

  return {
    judul: judul.slice(0, 120),
    tanggal,
    jam,
    kategori: lokal.kategori,
    estimasiJam: lokal.estimasiJam,
    prioritas: lokal.prioritas,
  };
}

// ==================== ENTRY POINT ====================
export async function isiOtomatisTugasAI(
  kalimat: string,
): Promise<HasilAutoFill> {
  const teks = String(kalimat ?? "").trim();

  if (teks.length < 2) {
    return {
      ok: false,
      error: "Ketik atau ucapkan deskripsi tugas singkat terlebih dahulu.",
    };
  }

  if (teks.length > 1500) {
    return {
      ok: false,
      error: "Deskripsi terlalu panjang. Maksimal 1500 karakter.",
    };
  }

  const user = await getDemoUser();
  if (!user) {
    return {
      ok: false,
      error: "Sesi berakhir. Silakan login kembali.",
    };
  }

  const lokal = ekstrakKalimatLokal(teks);

  const adaTanggalAbsolut = teksMemuatTanggalAbsolut(teks);

  const lokalLengkap =
    lokal.jam !== "23:59" && lokal.judul.length >= 3 && !adaTanggalAbsolut;

  // Parsing lokal tidak memakai kuota AI dan tidak memerlukan request Groq.
  if (lokalLengkap) {
    return { ok: true, data: lokal };
  }

  const aiLimit = await cekRateLimit(
    "ai-autofill",
    user.id,
    30,
    MILLISECONDS_PER_DAY,
  );

  if (!aiLimit.allowed) {
    return {
      ok: false,
      error: "Batas penggunaan AI Autofill harian sudah tercapai.",
    };
  }

  const ai = await cobaParseAI(teks);
  const hasil = mergeHasil(lokal, ai, teks);
  const hasilValid = autoFillSchema.safeParse({
    ...hasil,
    judul: bersihkanJudul(hasil.judul) || hasil.judul,
  });

  if (!hasilValid.success) {
    return {
      ok: false,
      error:
        "Mate belum bisa membaca deadline dengan benar. Coba tulis tanggal dan jam secara lebih jelas.",
    };
  }

  return { ok: true, data: hasilValid.data };
}

// ==================== UPDATE PROFIL ====================
export async function ubahProfilPreferensi(formData: FormData) {
  const user = await getDemoUser();
  if (!user) return;

  const namaBaru = String(formData.get("nama") ?? "").trim();
  const toneBaru = String(formData.get("coachTone") ?? "");

  const validTone = ["SANTAI", "TEGAS", "SUPPORTIVE"].includes(toneBaru)
    ? (toneBaru as "SANTAI" | "TEGAS" | "SUPPORTIVE")
    : undefined;

  await db.user.update({
    where: { id: user.id },
    data: {
      ...(namaBaru.length >= 2 ? { name: namaBaru.slice(0, 40) } : {}),
      ...(validTone ? { coachTone: validTone } : {}),
    },
  });

  revalidatePath("/profil");
}
