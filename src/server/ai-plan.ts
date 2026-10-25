"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ambilModel } from "@/lib/ai/model";
import { getDemoUser } from "./demo-user";

export type HasilRencana = { ok: boolean; pesan: string } | null;

const rencanaSchema = z.object({
  tugas: z.array(
    z.object({
      judul: z.string(),
      tenggat: z.string(),
      kategori: z.string(),
      prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]),
      estimasiMenit: z.number().int(),
      langkah: z.array(
        z.object({
          judul: z.string(),
          estimasiMenit: z.number().int(),
          targetSelesai: z.string(),
        }),
      ),
    }),
  ),
  catatanMate: z.string(),
});

const pecahSatuSchema = z.object({
  langkah: z.array(
    z.object({
      judul: z.string(),
      estimasiMenit: z.number().int(),
      targetSelesai: z.string(),
    }),
  ),
  catatanMate: z.string(),
});

function ekstrakJson<T>(teksMentah: string, skema: z.ZodType<T>): T | null {
  const bersih = teksMentah
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const awal = bersih.indexOf("{");
  const akhir = bersih.lastIndexOf("}");
  if (awal === -1 || akhir === -1 || akhir <= awal) return null;

  try {
    const objek = JSON.parse(bersih.slice(awal, akhir + 1));
    const hasil = skema.safeParse(objek);
    return hasil.success ? hasil.data : null;
  } catch {
    return null;
  }
}

export async function rencanakan(
  _prev: HasilRencana,
  formData: FormData,
): Promise<HasilRencana> {
  const teks = String(formData.get("teks") ?? "").trim();
  if (teks.length < 5)
    return { ok: false, pesan: "Tulis dulu tugasnya, minimal satu kalimat." };
  if (teks.length > 1500)
    return { ok: false, pesan: "Terlalu panjang. Maksimal 1500 karakter." };

  let infoModel;
  try {
    infoModel = ambilModel();
  } catch (e) {
    return {
      ok: false,
      pesan:
        e instanceof Error
          ? e.message
          : "Konfigurasi AI belum lengkap di .env.",
    };
  }

  const user = await getDemoUser();
  const sekarang = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const t0 = Date.now();

  try {
    const { text, usage, finishReason } = await generateText({
      model: infoModel.model,
      temperature: 0.2,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(25_000),
      system: [
        "Kamu Mate, AI accountability partner untuk pelajar dan mahasiswa Indonesia.",
        `Sekarang: ${sekarang} (WIB, UTC+7, tahun ${new Date().getFullYear()}).`,
        "Ubah tulisan user menjadi jadwal tugas terstruktur dalam format JSON murni.",
        "Aturan wajib:",
        "- Kembalikan HANYA objek JSON valid tanpa markdown ```json dan tanpa teks pengantar.",
        "- Nama hari seperti 'Jumat' berarti hari itu yang terdekat ke depan dari waktu sekarang. Jika jam tidak disebut, gunakan 23:59:00+07:00.",
        "- Pecah tiap tugas menjadi 2 sampai 4 langkah kecil konkret yang mudah dimulai (maksimal 90 menit per langkah).",
        "- targetSelesai tiap langkah berformat ISO 8601 dengan offset +07:00 (contoh: 2026-10-28T20:00:00+07:00), berurutan sebelum tenggat utama.",
        "- prioritas wajib salah satu dari: LOW, MEDIUM, HIGH.",
        "- kategori wajib singkat, contoh: Kuliah, Organisasi, Pribadi.",
        "- catatanMate: 1-2 kalimat bahasa Indonesia santai ala teman kuliah yang menyemangati dan menyebut langkah pertama yang harus dikerjakan sekarang.",
        "Format JSON yang wajib diikuti:",
        JSON.stringify({
          tugas: [
            {
              judul: "Laporan Praktikum Kimia",
              tenggat: "2026-10-30T23:59:00+07:00",
              kategori: "Kuliah",
              prioritas: "HIGH",
              estimasiMenit: 120,
              langkah: [
                {
                  judul: "Rekap tabel data pengamatan dan hitung rata-rata",
                  estimasiMenit: 45,
                  targetSelesai: "2026-10-28T20:00:00+07:00",
                },
              ],
            },
          ],
          catatanMate:
            "Yuk cicil rekap tabel datanya dulu 45 menit malam ini biar besok tinggal pembahasan!",
        }),
      ].join("\n"),
      prompt: `Tulisan user:\n"""\n${teks}\n"""\n\nKembalikan JSON:`,
    });

    const durasi = Date.now() - t0;
    console.log(
      `[mate] rencanakan (${infoModel.provider}:${infoModel.modelId}) selesai dalam ${durasi}ms | finish=${finishReason}`,
      usage,
    );

    const output = ekstrakJson(text, rencanaSchema);

    if (!output || output.tugas.length === 0) {
      return {
        ok: false,
        pesan:
          "Mate belum menemukan tugas di tulisan itu. Coba sebut nama tugas dan tenggatnya.",
      };
    }

    const siap = output.tugas.slice(0, 8).flatMap((t) => {
      const due = new Date(t.tenggat);
      if (Number.isNaN(due.getTime())) return [];
      const langkah = t.langkah.slice(0, 6).map((l) => {
        const target = new Date(l.targetSelesai);
        return {
          title: l.judul,
          estimateMin: Math.max(10, l.estimasiMenit || 30),
          dueAt: Number.isNaN(target.getTime()) ? due : target,
        };
      });
      return [{ t, due, langkah }];
    });

    if (siap.length === 0) {
      return {
        ok: false,
        pesan: "Tenggatnya belum terbaca. Coba tulis harinya lebih jelas.",
      };
    }

    await Promise.all(
      siap.map(({ t, due, langkah }) =>
        db.task.create({
          data: {
            userId: user.id,
            title: t.judul,
            category: t.kategori,
            priority: t.prioritas,
            estimateMin: Math.max(15, t.estimasiMenit || 60),
            dueAt: due,
            softDueAt: langkah.length
              ? langkah[langkah.length - 1].dueAt
              : null,
            subtasks: {
              create: langkah.map((l) => ({ userId: user.id, ...l })),
            },
          },
        }),
      ),
    );

    const jumlahTugas = siap.length;
    const jumlahLangkah = siap.reduce((n, s) => n + s.langkah.length, 0);

    await db.coachNote.create({
      data: { userId: user.id, body: output.catatanMate.slice(0, 300) },
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      pesan: `Selesai dalam ${(durasi / 1000).toFixed(1)} detik: ${jumlahTugas} tugas & ${jumlahLangkah} langkah kecil berhasil disusun!`,
    };
  } catch (err) {
    console.error("rencanakan gagal:", err);
    const lama = err instanceof Error && err.name === "TimeoutError";
    return {
      ok: false,
      pesan: lama
        ? "Mate kelamaan mikir. Coba lagi, atau persingkat tulisannya."
        : "Mate lagi nggak bisa dihubungi. Pastikan API Key di .env sudah benar.",
    };
  }
}

export async function pecahLangkahAI(
  taskId: string,
): Promise<{ ok: boolean; pesan: string }> {
  let infoModel;
  try {
    infoModel = ambilModel();
  } catch (e) {
    return {
      ok: false,
      pesan:
        e instanceof Error
          ? e.message
          : "Konfigurasi AI belum lengkap di .env.",
    };
  }

  const user = await getDemoUser();
  const tugas = await db.task.findFirst({
    where: { id: taskId, userId: user.id, parentId: null },
  });

  if (!tugas) {
    return { ok: false, pesan: "Tugas tidak ditemukan." };
  }

  const sekarang = new Date();
  const due = tugas.dueAt ?? new Date(sekarang.getTime() + 86_400_000);
  const totalMenit = tugas.estimateMin ?? 120;

  const t0 = Date.now();
  try {
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.25,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(20_000),
      system: [
        "Kamu Mate, asisten produktivitas mahasiswa Indonesia.",
        "Tugasmu: memecah 1 tugas kuliah/organisasi yang terasa berat menjadi 3 atau 4 langkah kecil yang super konkret dan gampang dimulai sekarang (Anti-Prokrastinasi).",
        "Kembalikan HANYA objek JSON valid tanpa markdown ```json.",
        "Format JSON wajib:",
        JSON.stringify({
          langkah: [
            {
              judul:
                "Buka dokumen dan buat kerangka judul sub-bab (pemanasan 15 menit)",
              estimasiMenit: 15,
              targetSelesai: "2026-10-26T10:00:00+07:00",
            },
          ],
          catatanMate:
            "Jangan pusing lihat total tugasnya bro, sikat langkah pertama 15 menit aja dulu!",
        }),
      ].join("\n"),
      prompt: [
        `Judul tugas: "${tugas.title}"`,
        `Kategori: ${tugas.category ?? "Kuliah"}`,
        `Total estimasi: ${totalMenit} menit`,
        `Waktu sekarang: ${sekarang.toISOString()}`,
        `Tenggat akhir: ${due.toISOString()}`,
        "Pecah menjadi 3-4 langkah berurutan dalam JSON:",
      ].join("\n"),
    });

    const durasi = Date.now() - t0;
    console.log(
      `[mate] pecahLangkahAI (${infoModel.provider}:${infoModel.modelId}) selesai dalam ${durasi}ms`,
    );

    const output = ekstrakJson(text, pecahSatuSchema);
    if (!output || output.langkah.length === 0) {
      return {
        ok: false,
        pesan: "Gagal memecah langkah. Coba klik sekali lagi.",
      };
    }

    await db.task.deleteMany({
      where: { parentId: tugas.id, userId: user.id },
    });

    const daftarLangkah = output.langkah.slice(0, 5).map((l, idx) => {
      const target = new Date(l.targetSelesai);
      const fallbackDate = new Date(
        sekarang.getTime() +
          ((due.getTime() - sekarang.getTime()) * (idx + 1)) /
            (output.langkah.length + 1),
      );
      return {
        userId: user.id,
        parentId: tugas.id,
        title: l.judul,
        estimateMin: Math.max(10, l.estimasiMenit || 25),
        dueAt: Number.isNaN(target.getTime()) ? fallbackDate : target,
      };
    });

    await db.task.createMany({ data: daftarLangkah });
    await db.coachNote.create({
      data: {
        userId: user.id,
        taskId: tugas.id,
        body: output.catatanMate.slice(0, 300),
      },
    });

    revalidatePath("/", "layout");
    return {
      ok: true,
      pesan: `${daftarLangkah.length} langkah kecil berhasil dibuat!`,
    };
  } catch (err) {
    console.error("pecahLangkahAI gagal:", err);
    return {
      ok: false,
      pesan: "Gagal menghubungi AI. Cek koneksi atau API Key.",
    };
  }
}
