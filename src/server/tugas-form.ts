"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { ambilModel } from "@/lib/ai/model";
import { getDemoUser } from "@/server/demo-user";
import { dayKey, keDueAt, tambahHari } from "@/lib/waktu";

// ==================== SKEMA SIMPAN TUGAS ====================
const skema = z.object({
  id: z.string().optional(),
  judul: z
    .string()
    .trim()
    .min(1, "Nama tugas wajib diisi")
    .max(120, "Nama maksimal 120 karakter"),
  catatan: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter")
    .optional(),
  attachmentUrl: z.string().optional().or(z.literal("")),
  attachmentName: z.string().optional().or(z.literal("")),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal deadline wajib diisi"),
  jam: z.string().regex(/^\d{2}:\d{2}$/, "Jam tidak valid"),
  kategori: z.string().trim().min(1, "Pilih kategori").max(40),
  estimasi: z.coerce
    .number()
    .min(0.5, "Estimasi minimal 0,5 jam")
    .max(40, "Estimasi maksimal 40 jam"),
  prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export type HasilForm = { ok: boolean; error?: string };

export async function simpanTugas(
  _: HasilForm,
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
  if (!baca.success) return { ok: false, error: baca.error.issues[0].message };

  const d = baca.data;
  const dueAt = keDueAt(d.tanggal, d.jam);
  if (Number.isNaN(dueAt.getTime()))
    return { ok: false, error: "Tanggal atau jam tidak valid" };

  const user = await getDemoUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan login ulang." };

  const estimateMin = Math.round(d.estimasi * 60);
  const notesValue = d.catatan && d.catatan.length > 0 ? d.catatan : null;
  const attachmentUrlValue =
    d.attachmentUrl && d.attachmentUrl.length > 0 ? d.attachmentUrl : null;
  const attachmentNameValue =
    d.attachmentName && d.attachmentName.length > 0 ? d.attachmentName : null;

  if (d.id) {
    const existing = await db.task.findUnique({
      where: { id: d.id, userId: user.id },
      select: { attachmentUrl: true },
    });

    const r = await db.task.updateMany({
      where: { id: d.id, userId: user.id, parentId: null },
      data: {
        title: d.judul,
        notes: notesValue,
        attachmentUrl: attachmentUrlValue,
        attachmentName: attachmentNameValue,
        dueAt,
        category: d.kategori,
        estimateMin,
        ...(d.prioritas ? { priority: d.prioritas } : {}),
      },
    });
    if (r.count === 0) return { ok: false, error: "Tugas tidak ditemukan" };

    if (
      existing?.attachmentUrl &&
      existing.attachmentUrl !== attachmentUrlValue
    ) {
      try {
        await del(existing.attachmentUrl);
      } catch (e) {
        console.warn("[blob] Gagal hapus file lama:", e);
      }
    }
  } else {
    const jamLagi = (dueAt.getTime() - Date.now()) / 3_600_000;
    const priority =
      d.prioritas ??
      (jamLagi <= 24 ? "HIGH" : jamLagi <= 48 ? "MEDIUM" : "LOW");
    await db.task.create({
      data: {
        userId: user.id,
        title: d.judul,
        notes: notesValue,
        attachmentUrl: attachmentUrlValue,
        attachmentName: attachmentNameValue,
        dueAt,
        category: d.kategori,
        estimateMin,
        priority,
      },
    });
  }

  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");

  return { ok: true };
}

// ==================== AUTO-FILL AI (HYBRID SYSTEM) ====================
const autoFillSchema = z.object({
  judul: z.string(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jam: z.string().regex(/^\d{2}:\d{2}$/),
  kategori: z.enum(["Kuliah", "Organisasi", "Pribadi"]),
  estimasiJam: z.number().min(0.5).max(24),
  prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type HasilAutoFill =
  | { ok: true; data: z.infer<typeof autoFillSchema> }
  | { ok: false; error: string };

// ==================== SANITIZER JUDUL (SUPER AGRESIF) ====================
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
    /\b(ini|itu|dong|ya|sih|deh|kok|kan|lah|tuh|nih|aja|saja|banget|bgt|bener|bgt|emang|sumpah|jujur|harus|mesti|pasti|wajib)\b/gi,
    "",
  );
  hasil = hasil.replace(/[,;:]+/g, " ");
  hasil = hasil.replace(/\s+/g, " ").trim();
  hasil = hasil.replace(/^(?:untuk|buat|dari|ke|di)\s+/i, "");
  hasil = hasil.replace(/\s+(?:untuk|buat|dari|ke|di)$/i, "");

  if (hasil.length < 3) return judul.trim();
  return hasil.charAt(0).toUpperCase() + hasil.slice(1);
}

// ==================== LOCAL PARSER (DETERMINISTIC) ====================
function ekstrakKalimatLokal(teksAsli: string): z.infer<typeof autoFillSchema> {
  const lower = teksAsli.toLowerCase();
  const now = new Date();
  const hariIniIso = dayKey(now);

  let offsetHari = 1;
  let jam = "23:59";
  let tanggal = hariIniIso;
  let waktuSpesifikTerdeteksi = false;

  // Deklarasi di scope fungsi biar bisa diakses di blok ESTIMASI
  let matchJamKata: RegExpMatchArray | null = null;

  // DETEKSI WAKTU RELATIF
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
    const menit = parseInt(matchMenit[1], 10);
    const target = new Date(now.getTime() + menit * 60_000);
    jam = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
    tanggal = dayKey(target);
    offsetHari = 0;
    waktuSpesifikTerdeteksi = true;
  } else if (matchJamRelatif) {
    const jamTambahan = parseInt(matchJamRelatif[1], 10);
    const target = new Date(now.getTime() + jamTambahan * 3_600_000);
    jam = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
    tanggal = dayKey(target);
    offsetHari = 0;
    waktuSpesifikTerdeteksi = true;
  } else if (matchHariRelatif) {
    const hariTambahan = parseInt(matchHariRelatif[1], 10);
    const target = new Date(now.getTime() + hariTambahan * 86_400_000);
    tanggal = dayKey(target);
    offsetHari = hariTambahan;
    jam = "23:59";
    waktuSpesifikTerdeteksi = true;
  } else {
    // DETEKSI TANGGAL
    if (/\b(hari ini|malam ini|sore ini|pagi ini|sekarang)\b/.test(lower))
      offsetHari = 0;
    else if (/\b(lusa)\b/.test(lower)) offsetHari = 2;
    else if (/\b(mingdep|minggu depan|pekan depan)\b/.test(lower))
      offsetHari = 7;
    else if (/\b(besok)\b/.test(lower)) offsetHari = 1;
    else {
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
      for (const [namaHari, idxTarget] of Object.entries(petaHari)) {
        if (new RegExp(`\\b${namaHari}\\b`).test(lower)) {
          const hariSekarang = now.getDay();
          let selisih = idxTarget - hariSekarang;
          if (selisih <= 0) selisih += 7;
          offsetHari = selisih;
          break;
        }
      }
    }
    tanggal = tambahHari(hariIniIso, offsetHari);

    // DETEKSI JAM EKSPLISIT
    matchJamKata = lower.match(
      /\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/,
    );

    if (matchJamKata) {
      let hh = parseInt(matchJamKata[1], 10);
      const mm = matchJamKata[2] ? matchJamKata[2] : "00";
      const ket = matchJamKata[3];
      if ((ket === "sore" || ket === "malam") && hh < 12) hh += 12;
      if (ket === "siang" && hh < 11) hh += 12;
      jam = `${String(Math.min(23, hh)).padStart(2, "0")}:${mm}`;
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
    } else if (/\btengah malam\b/.test(lower)) {
      jam = "23:59";
      waktuSpesifikTerdeteksi = true;
    }
  }

  // ================= KATEGORI =================
  let kategori: "Kuliah" | "Organisasi" | "Pribadi" = "Kuliah";
  if (
    /\b(ukm|rapat|panitia|organisasi|hima|bem|divisi|proker|kepanitiaan)\b/.test(
      lower,
    )
  )
    kategori = "Organisasi";
  else if (
    /\b(beli|olahraga|gym|kamar|rumah|pribadi|laundry|jalan|tidur|nonton|main)\b/.test(
      lower,
    )
  )
    kategori = "Pribadi";

  // ================= ESTIMASI =================
  let estimasiJam = 2;
  const matchDurasi = lower.match(/(\d+(?:[.,]\d+)?)\s*jam\b/);

  // matchJamKata bisa diakses di sini karena dideklarasi di atas
  if (
    matchDurasi &&
    !matchJamKata?.[0]?.includes(matchDurasi[0]) &&
    !matchJamRelatif?.[0]?.includes(matchDurasi[0])
  ) {
    estimasiJam = Math.min(
      12,
      Math.max(0.5, parseFloat(matchDurasi[1].replace(",", "."))),
    );
  } else if (
    /\b(laprak|laporan|makalah|skripsi|project|proyek|coding|proposal|jurnal)\b/.test(
      lower,
    )
  )
    estimasiJam = 3;
  else if (/\b(kuis|uts|uas|ujian|tryout|latihan soal)\b/.test(lower))
    estimasiJam = 2;
  else if (/\b(rangkum|review|baca|baca materi|nonton)\b/.test(lower))
    estimasiJam = 1.5;

  // ================= PRIORITAS =================
  let prioritas: "LOW" | "MEDIUM" | "HIGH" =
    offsetHari <= 1 ? "HIGH" : offsetHari <= 3 ? "MEDIUM" : "LOW";
  if (
    /\b(penting|mendesak|urgent|ujian|uts|uas|besok|hari ini|malam ini)\b/.test(
      lower,
    )
  )
    prioritas = "HIGH";
  else if (/\b(santai|gampang|ringan|nanti)\b/.test(lower)) prioritas = "LOW";
  if (waktuSpesifikTerdeteksi && offsetHari === 0) prioritas = "HIGH";

  // ================= JUDUL =================
  const judulBersih = bersihkanJudul(teksAsli);

  return {
    judul: judulBersih.slice(0, 100),
    tanggal,
    jam,
    kategori,
    estimasiJam,
    prioritas,
  };
}

// ==================== AI PARSER ====================
async function cobaParseAI(
  teks: string,
): Promise<z.infer<typeof autoFillSchema> | null> {
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
        "Kamu asisten ekstraksi form tugas. Tugasmu: ubah kalimat user jadi JSON terstruktur.",
        "",
        `WAKTU SEKARANG (WIB): ${sekarangLengkap}`,
        `JAM SEKARANG (WIB): ${jamSekarangWIB}`,
        `TANGGAL HARI INI: ${hariIniIso}`,
        `TANGGAL BESOK: ${besokIso}`,
        "",
        "ATURAN WAKTU (WAJIB):",
        "- 'X jam lagi' / 'dalam X jam' / 'X jam dari sekarang' → jam sekarang + X jam",
        "- 'X menit lagi' → jam sekarang + X menit",
        "- 'X hari lagi' → tanggal hari ini + X hari, jam 23:59",
        "- 'jam 9 malam' → 21:00 | 'jam 3 sore' → 15:00 | 'jam 7 pagi' → 07:00",
        "- 'abis maghrib' → 18:00 | 'abis isya' → 20:00 | 'subuh' → 05:00",
        "- 'nanti malam' → 20:00 | 'tengah malam' → 23:59",
        "- Kalau lewat tengah malam, tanggal harus maju ke besok",
        "",
        "ATURAN JUDUL (WAJIB):",
        "- Judul = HANYA nama tugas, tanpa kata waktu/deadline/filler",
        "- BUANG: 'deadline', 'deadlinenya', 'tenggat', 'kumpul', 'dikumpul', 'jam X', 'X jam lagi', 'hari ini', 'besok', 'ini', 'itu', 'dong', 'ya', 'sih', 'deh', 'nya' (suffix)",
        "- Contoh BENAR: 'tugas matematika deadline 3 jam lagi' → judul: 'Tugas Matematika'",
        "- Contoh BENAR: 'laprak kimia besok jam 9 malam' → judul: 'Laprak Kimia'",
        "",
        "ATURAN KATEGORI:",
        "- 'Kuliah' default. 'Organisasi' kalau ada ukm/hima/bem/rapat/panitia.",
        "- 'Pribadi' kalau beli/gym/rumah/laundry.",
        "",
        "ATURAN ESTIMASI:",
        "- Default 2 jam. Laporan/makalah/skripsi → 3 jam. Kuis → 1.5 jam.",
        "",
        "ATURAN PRIORITAS:",
        "- HIGH kalau deadline hari ini/besok/penting/uts/uas.",
        "- LOW kalau santai/nanti.",
        "- MEDIUM selain itu.",
        "",
        "KEMBALIKAN HANYA JSON (tanpa markdown, tanpa teks tambahan):",
        JSON.stringify({
          judul: "Tugas Matematika",
          tanggal: hariIniIso,
          jam: "22:00",
          kategori: "Kuliah",
          estimasiJam: 2,
          prioritas: "HIGH",
        }),
      ].join("\n"),
      prompt: `Kalimat user: "${teks}"\n\nJSON:`,
    });

    const awal = text.indexOf("{");
    const akhir = text.lastIndexOf("}");
    if (awal === -1 || akhir === -1) return null;

    const parsed = autoFillSchema.safeParse(
      JSON.parse(text.slice(awal, akhir + 1)),
    );
    return parsed.success ? parsed.data : null;
  } catch (e) {
    console.warn("[mate] AI gagal, pakai local parser:", e);
    return null;
  }
}

// ==================== MERGE LOGIC (HYBRID) ====================
function mergeHasil(
  lokal: z.infer<typeof autoFillSchema>,
  ai: z.infer<typeof autoFillSchema> | null,
): z.infer<typeof autoFillSchema> {
  if (!ai) return lokal;

  const jamDefault = "23:59";
  const aiPunyaWaktuSpesifik = ai.jam && ai.jam !== jamDefault;
  const lokalPunyaWaktuSpesifik = lokal.jam && lokal.jam !== jamDefault;

  // FIX: ganti let -> const (gak pernah di-reassign)
  const jam =
    !lokalPunyaWaktuSpesifik && aiPunyaWaktuSpesifik ? ai.jam : lokal.jam;
  const tanggal =
    !lokalPunyaWaktuSpesifik && aiPunyaWaktuSpesifik
      ? ai.tanggal
      : lokal.tanggal;

  // FIX: Simplify logic judul (hilangkan redundansi)
  const judulAI = ai.judul ? bersihkanJudul(ai.judul) : "";
  const judulLokal = lokal.judul ? bersihkanJudul(lokal.judul) : "";
  const aiLebihBaik =
    judulAI.length >= 3 && judulAI.length > judulLokal.length * 0.7;
  const judul = aiLebihBaik ? judulAI : judulLokal;

  return {
    judul,
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
  const teks = kalimat.trim();
  if (teks.length < 2) {
    return {
      ok: false,
      error: "Ketik atau ucapkan dulu tugasnya singkat aja.",
    };
  }

  const lokal = ekstrakKalimatLokal(teks);
  const lokalLengkap = lokal.jam !== "23:59" && lokal.judul.length >= 3;

  // FIX: Cuma panggil AI kalau lokal beneran gagal (hemat kuota Groq + lebih cepat)
  if (lokalLengkap) {
    return { ok: true, data: lokal };
  }

  const ai = await cobaParseAI(teks);
  const hasil = mergeHasil(lokal, ai);
  hasil.judul = bersihkanJudul(hasil.judul) || hasil.judul;

  return { ok: true, data: hasil };
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
