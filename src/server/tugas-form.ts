"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ambilModel } from "@/lib/ai/model";
import { getDemoUser } from "@/server/demo-user";
import { dayKey, keDueAt, tambahHari } from "@/lib/waktu";

const skema = z.object({
  id: z.string().optional(),
  judul: z
    .string()
    .trim()
    .min(1, "Nama tugas wajib diisi")
    .max(120, "Nama maksimal 120 karakter"),
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
  const estimateMin = Math.round(d.estimasi * 60);

  if (d.id) {
    const r = await db.task.updateMany({
      where: { id: d.id, userId: user.id, parentId: null },
      data: {
        title: d.judul,
        dueAt,
        category: d.kategori,
        estimateMin,
        ...(d.prioritas ? { priority: d.prioritas } : {}),
      },
    });
    if (r.count === 0) return { ok: false, error: "Tugas tidak ditemukan" };
  } else {
    const jamLagi = (dueAt.getTime() - Date.now()) / 3_600_000;
    const priority =
      d.prioritas ??
      (jamLagi <= 24 ? "HIGH" : jamLagi <= 48 ? "MEDIUM" : "LOW");
    await db.task.create({
      data: {
        userId: user.id,
        title: d.judul,
        dueAt,
        category: d.kategori,
        estimateMin,
        priority,
      },
    });
  }

  // SPESIFIK
  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");

  return { ok: true };
}

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

function ekstrakKalimatLokal(teksAsli: string): z.infer<typeof autoFillSchema> {
  const lower = teksAsli.toLowerCase();
  const now = new Date();
  const hariIniIso = dayKey(now);

  let offsetHari = 1;
  if (/\b(hari ini|malam ini|sore ini|sekarang)\b/.test(lower)) offsetHari = 0;
  else if (/\b(lusa)\b/.test(lower)) offsetHari = 2;
  else if (/\b(mingdep|minggu depan|pekan depan)\b/.test(lower)) offsetHari = 7;
  else {
    const petaHari: Record<string, number> = {
      minggu: 0,
      ahad: 0,
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
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
  const tanggal = tambahHari(hariIniIso, offsetHari);

  let jam = "23:59";
  const matchJam = lower.match(
    /\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/,
  );
  if (matchJam) {
    let hh = parseInt(matchJam[1], 10);
    const mm = matchJam[2] ? matchJam[2] : "00";
    const ket = matchJam[3];
    if ((ket === "sore" || ket === "malam") && hh < 12) hh += 12;
    if (ket === "siang" && hh < 11) hh += 12;
    jam = `${String(Math.min(23, hh)).padStart(2, "0")}:${mm}`;
  } else if (/\bpagi\b/.test(lower)) jam = "09:00";
  else if (/\bsiang\b/.test(lower)) jam = "13:00";
  else if (/\bsore\b/.test(lower)) jam = "16:30";
  else if (/\bmalam\b/.test(lower)) jam = "21:00";

  let kategori: "Kuliah" | "Organisasi" | "Pribadi" = "Kuliah";
  if (/\b(ukm|rapat|panitia|organisasi|hima|bem|divisi|proker)\b/.test(lower))
    kategori = "Organisasi";
  else if (
    /\b(beli|olahraga|gym|kamar|rumah|pribadi|laundry|jalan|tidur)\b/.test(
      lower,
    )
  )
    kategori = "Pribadi";

  let estimasiJam = 2;
  const matchDurasi = lower.match(/(\d+(?:[.,]\d+)?)\s*jam\b/);
  if (matchDurasi && !matchJam?.[0]?.includes(matchDurasi[0])) {
    estimasiJam = Math.min(
      12,
      Math.max(0.5, parseFloat(matchDurasi[1].replace(",", "."))),
    );
  } else if (
    /\b(laprak|laporan|makalah|skripsi|project|proyek|coding)\b/.test(lower)
  )
    estimasiJam = 3;
  else if (/\b(kuis|rangkum|review|baca)\b/.test(lower)) estimasiJam = 1.5;

  let prioritas: "LOW" | "MEDIUM" | "HIGH" =
    offsetHari <= 1 ? "HIGH" : offsetHari <= 3 ? "MEDIUM" : "LOW";
  if (/\b(penting|mendesak|urgent|ujian|uts|uas|besok|hari ini)\b/.test(lower))
    prioritas = "HIGH";
  else if (/\b(santai|gampang|ringan)\b/.test(lower)) prioritas = "LOW";

  let judulBersih = teksAsli
    .replace(
      /\b(kumpul|dikumpul|deadline|tenggat)?\s*(hari ini|besok|lusa|mingdep|minggu depan|senin|selasa|rabu|kamis|jumat|sabtu|minggu)\s*(depan)?\b/gi,
      "",
    )
    .replace(
      /\b(jam|pukul)\s*\d{1,2}(?:[:.]\d{2})?\s*(pagi|siang|sore|malam)?\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (judulBersih.length < 3) judulBersih = teksAsli.trim();
  judulBersih = judulBersih.charAt(0).toUpperCase() + judulBersih.slice(1);

  return {
    judul: judulBersih.slice(0, 100),
    tanggal,
    jam,
    kategori,
    estimasiJam,
    prioritas,
  };
}

export async function isiOtomatisTugasAI(
  kalimat: string,
): Promise<HasilAutoFill> {
  const teks = kalimat.trim();
  if (teks.length < 2)
    return {
      ok: false,
      error: "Ketik atau ucapkan dulu tugasnya singkat aja.",
    };

  const now = new Date();
  const hariIniIso = dayKey(now);
  const besokIso = tambahHari(hariIniIso, 1);

  try {
    const infoModel = ambilModel();
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.1,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(10_000),
      system: [
        "Kamu asisten ekstraksi form tugas untuk mahasiswa Indonesia.",
        `Tanggal hari ini: ${hariIniIso}, besok: ${besokIso}.`,
        "Kembalikan HANYA objek JSON murni tanpa markdown.",
        JSON.stringify({
          judul: "Belajar & Latihan Kalkulus",
          tanggal: besokIso,
          jam: "20:00",
          kategori: "Kuliah",
          estimasiJam: 2,
          prioritas: "HIGH",
        }),
      ].join("\n"),
      prompt: `Kalimat user: "${teks}"\nJSON:`,
    });

    const awal = text.indexOf("{");
    const akhir = text.lastIndexOf("}");
    if (awal !== -1 && akhir !== -1) {
      const parsed = autoFillSchema.safeParse(
        JSON.parse(text.slice(awal, akhir + 1)),
      );
      if (parsed.success) return { ok: true, data: parsed.data };
    }
  } catch (e) {
    console.warn("[mate] Cloud AI fallback ke Smart NLP Lokal:", e);
  }

  const hasilLokal = ekstrakKalimatLokal(teks);
  return { ok: true, data: hasilLokal };
}

export async function ubahProfilPreferensi(formData: FormData) {
  const user = await getDemoUser();
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

  // Revalidate profil aja
  revalidatePath("/profil");
}
