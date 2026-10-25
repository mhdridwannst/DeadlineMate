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

  revalidatePath("/", "layout");
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
  | {
      ok: true;
      data: z.infer<typeof autoFillSchema>;
    }
  | {
      ok: false;
      error: string;
    };

export async function isiOtomatisTugasAI(
  kalimat: string,
): Promise<HasilAutoFill> {
  const teks = kalimat.trim();
  if (teks.length < 3) {
    return {
      ok: false,
      error: "Ketik atau ucapkan dulu tugasnya singkat aja.",
    };
  }

  let infoModel;
  try {
    infoModel = ambilModel();
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Konfigurasi AI belum lengkap di .env",
    };
  }

  const now = new Date();
  const hariIniIso = dayKey(now);
  const besokIso = tambahHari(hariIniIso, 1);
  const infoHari = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(now);

  try {
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.1,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(15_000),
      system: [
        "Kamu asisten ekstraksi form tugas untuk mahasiswa Indonesia.",
        `Waktu sekarang: ${infoHari} (Tanggal ISO hari ini: ${hariIniIso}, besok: ${besokIso}).`,
        "Ekstrak kalimat user menjadi JSON murni tanpa markdown ```json.",
        "Aturan:",
        "- judul: nama tugas yang rapi dan jelas.",
        "- tanggal: format YYYY-MM-DD. Jika tidak disebut, gunakan besok.",
        "- jam: format HH:MM (24 jam). Jika tidak disebut, gunakan 23:59.",
        "- kategori: pilih tepat satu dari 'Kuliah', 'Organisasi', atau 'Pribadi'.",
        "- estimasiJam: angka jam pengerjaan (contoh: 1, 2, 3, 4).",
        "- prioritas: 'HIGH' jika besok/hari ini/mendesak, 'MEDIUM' jika <4 hari, 'LOW' jika santai.",
        "Contoh output JSON:",
        JSON.stringify({
          judul: "Laporan Praktikum Sinyal",
          tanggal: besokIso,
          jam: "16:00",
          kategori: "Kuliah",
          estimasiJam: 3,
          prioritas: "HIGH",
        }),
      ].join("\n"),
      prompt: `Kalimat user: "${teks}"\nJSON:`,
    });

    const bersih = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const awal = bersih.indexOf("{");
    const akhir = bersih.lastIndexOf("}");
    if (awal === -1 || akhir === -1) {
      return {
        ok: false,
        error: "AI belum bisa membaca format tugas. Coba lagi.",
      };
    }

    const parsed = autoFillSchema.safeParse(
      JSON.parse(bersih.slice(awal, akhir + 1)),
    );
    if (!parsed.success) {
      return {
        ok: false,
        error: "Hasil ekstraksi belum lengkap. Coba perjelas kalimatnya.",
      };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      error: "Gagal menghubungi AI. Pastikan GROQ_API_KEY di .env sudah aktif.",
    };
  }
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

  revalidatePath("/", "layout");
}
