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
  const awal = teksMentah.indexOf("{");
  const akhir = teksMentah.lastIndexOf("}");
  if (awal === -1 || akhir === -1 || akhir <= awal) return null;

  try {
    const objek = JSON.parse(teksMentah.slice(awal, akhir + 1));
    const hasil = skema.safeParse(objek);
    return hasil.success ? hasil.data : null;
  } catch {
    return null;
  }
}

// ================= FUNGSI BERSIHKAN JUDUL =================
// Menghapus "1. ", "2) ", "- ", "• " dari awal teks
function bersihkanJudul(judul: string) {
  return judul
    .replace(/^(?:\d+[.)]|[-*•])\s*/, "")
    .replace(/^(?:\d+\s+)/, "")
    .trim();
}

/** Generator Sub-Langkah Kontekstual Pintar */
function buatLangkahKontekstual(judul: string, due: Date) {
  const lower = judul.toLowerCase();
  const now = Date.now();
  const rentang = Math.max(3_600_000 * 6, due.getTime() - now);

  let template: { judul: string; estimasiMenit: number }[];

  if (
    /\b(laprak|praktikum|laboratorium|percobaan|sinyal|elektronika|kimia|fisika)\b/.test(
      lower,
    )
  ) {
    template = [
      {
        judul: "Rekap tabel data hasil pengamatan & gambar rangkaian",
        estimasiMenit: 35,
      },
      {
        judul: "Tulis analisis perhitungan dan pembahasan grafik",
        estimasiMenit: 50,
      },
      {
        judul: "Susun kesimpulan, daftar pustaka, dan ekspor ke PDF",
        estimasiMenit: 30,
      },
    ];
  } else if (
    /\b(kalkulus|matematika|statistik|soal|kuis|ujian|uts|uas|fisika)\b/.test(
      lower,
    )
  ) {
    template = [
      {
        judul: "Buka modul dan catat rumus-rumus kunci materi ini",
        estimasiMenit: 25,
      },
      {
        judul: "Kerjakan 5 soal latihan dasar untuk pemanasan konsep",
        estimasiMenit: 45,
      },
      {
        judul: "Selesaikan soal tingkat lanjut & periksa ulang langkah jawaban",
        estimasiMenit: 40,
      },
    ];
  } else if (
    /\b(makalah|esai|essay|jurnal|artikel|bab|skripsi|proposal|sosiologi|bindo)\b/.test(
      lower,
    )
  ) {
    template = [
      {
        judul: "Kumpulkan 3 referensi utama dan buat kerangka outline",
        estimasiMenit: 30,
      },
      {
        judul: "Tulis draf pembahasan utama sesuai poin outline",
        estimasiMenit: 60,
      },
      {
        judul: "Rapikan sitasi, cek typo, dan finalisasi dokumen",
        estimasiMenit: 30,
      },
    ];
  } else if (
    /\b(coding|web|next|react|aplikasi|program|bug|fitur|project|ui)\b/.test(
      lower,
    )
  ) {
    template = [
      {
        judul: "Siapkan struktur komponen dan skema data yang dibutuhkan",
        estimasiMenit: 35,
      },
      {
        judul: "Implementasi logika utama dan integrasi antarmuka",
        estimasiMenit: 60,
      },
      {
        judul: "Uji coba skenario error dan rapikan tampilan",
        estimasiMenit: 30,
      },
    ];
  } else {
    template = [
      {
        judul: `Siapkan materi dan rincian kebutuhan untuk ${judul}`,
        estimasiMenit: 25,
      },
      {
        judul: `Kerjakan bagian inti dari ${judul} fokus tanpa distraksi`,
        estimasiMenit: 45,
      },
      {
        judul: "Periksa kembali hasil akhir dan tandai selesai",
        estimasiMenit: 20,
      },
    ];
  }

  return template.map((item, idx) => ({
    judul: item.judul,
    estimasiMenit: item.estimasiMenit,
    targetSelesai: new Date(
      now + (rentang * (idx + 1)) / (template.length + 1),
    ).toISOString(),
  }));
}

function susunRencanaLokal(teks: string): z.infer<typeof rencanaSchema> {
  const potongan = teks
    .split(/(?:,|\n|;|\bdan\b)+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
    .slice(0, 6);

  const daftar = (potongan.length > 0 ? potongan : [teks.trim()]).map(
    (kalimat) => {
      const lower = kalimat.toLowerCase();
      const now = new Date();
      let offsetHari = 2;

      const petaHari: Record<string, number> = {
        minggu: 0,
        senin: 1,
        selasa: 2,
        rabu: 3,
        kamis: 4,
        jumat: 5,
        sabtu: 6,
      };
      for (const [h, idx] of Object.entries(petaHari)) {
        if (lower.includes(h)) {
          let selisih = idx - now.getDay();
          if (selisih <= 0) selisih += 7;
          if (lower.includes("depan")) selisih += 7;
          offsetHari = selisih;
          break;
        }
      }
      if (lower.includes("besok")) offsetHari = 1;
      if (lower.includes("hari ini") || lower.includes("malam ini"))
        offsetHari = 0;

      const due = new Date(now.getTime() + offsetHari * 86_400_000);
      due.setHours(23, 59, 0, 0);

      const judulBersih = kalimat
        .replace(
          /\b(kumpul|dikumpul|deadline|hari ini|besok|lusa|senin|selasa|rabu|kamis|jumat|sabtu|minggu|depan|jam\s*\d{1,2}(?:[.:]\d{2})?)\b/gi,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();

      const finalJudul = (
        judulBersih.length >= 3 ? judulBersih : kalimat
      ).replace(/^./, (c) => c.toUpperCase());

      // BERSIHKAN ANGKA DI SINI JUGA (Fallback AI)
      const judulFinalBersih = bersihkanJudul(finalJudul);

      const langkah = buatLangkahKontekstual(judulFinalBersih, due);
      const totalMenit = langkah.reduce((n, l) => n + l.estimasiMenit, 0);

      return {
        judul: judulFinalBersih,
        tenggat: due.toISOString(),
        kategori: /\b(ukm|rapat|organisasi|panitia)\b/.test(lower)
          ? "Organisasi"
          : "Kuliah",
        prioritas: (offsetHari <= 2
          ? "HIGH"
          : offsetHari <= 4
            ? "MEDIUM"
            : "LOW") as "HIGH" | "MEDIUM" | "LOW",
        estimasiMenit: totalMenit,
        langkah,
      };
    },
  );

  return {
    tugas: daftar,
    catatanMate: `Jadwalmu sudah kubuat menjadi langkah ringan! Yuk mulai cicil "${daftar[0].langkah[0].judul}" selama ${daftar[0].langkah[0].estimasiMenit} menit sekarang.`,
  };
}

export async function rencanakan(
  _prev: HasilRencana,
  formData: FormData,
): Promise<HasilRencana> {
  const teks = String(formData.get("teks") ?? "").trim();
  if (teks.length < 4)
    return { ok: false, pesan: "Tulis dulu tugasnya, minimal satu kalimat." };
  if (teks.length > 1500)
    return { ok: false, pesan: "Terlalu panjang. Maksimal 1500 karakter." };

  const user = await getDemoUser();
  const sekarang = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const t0 = Date.now();
  let output: z.infer<typeof rencanaSchema> | null = null;

  try {
    const infoModel = ambilModel();
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.2,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(12_000),
      system: [
        "Kamu Mate, AI accountability partner mahasiswa Indonesia.",
        `Sekarang: ${sekarang} (WIB, UTC+7).`,
        "Ubah kalimat user menjadi JSON jadwal tugas terstruktur tanpa markdown.",
        JSON.stringify({
          tugas: [
            {
              judul: "Laporan Praktikum Kimia",
              tenggat: "2026-10-30T23:59:00+07:00",
              kategori: "Kuliah",
              prioritas: "HIGH",
              estimasiMenit: 115,
              langkah: [
                {
                  judul: "Rekap tabel data hasil pengamatan",
                  estimasiMenit: 35,
                  targetSelesai: "2026-10-28T20:00:00+07:00",
                },
              ],
            },
          ],
          catatanMate:
            "Yuk cicil rekap tabel datanya dulu 35 menit malam ini biar besok tinggal pembahasan!",
        }),
      ].join("\n"),
      prompt: `Tulisan user:\n"""\n${teks}\n"""\nJSON:`,
    });

    output = ekstrakJson(text, rencanaSchema);
  } catch (e) {
    console.warn("[mate] rencanakan beralih ke Smart Engine Lokal:", e);
  }

  if (!output || output.tugas.length === 0) {
    output = susunRencanaLokal(teks);
  }

  const siap = output.tugas.slice(0, 8).flatMap((t) => {
    const due = new Date(t.tenggat);
    const validDue = Number.isNaN(due.getTime())
      ? new Date(Date.now() + 2 * 86_400_000)
      : due;
    const langkah = t.langkah.slice(0, 5).map((l) => {
      const target = new Date(l.targetSelesai);
      return {
        title: bersihkanJudul(l.judul), // Bersihkan judul sub-langkah
        estimateMin: Math.max(10, l.estimasiMenit || 30),
        dueAt: Number.isNaN(target.getTime()) ? validDue : target,
      };
    });
    return [
      {
        t,
        due: validDue,
        langkah,
        judulBersih: bersihkanJudul(t.judul), // Bersihkan judul utama
      },
    ];
  });

  await Promise.all(
    siap.map(({ judulBersih, due, langkah, t }) =>
      db.task.create({
        data: {
          userId: user.id,
          title: judulBersih, // <-- SIMPAN JUDUL BERSIH KE DB
          category: t.kategori,
          priority: t.prioritas,
          estimateMin: Math.max(15, t.estimasiMenit || 60),
          dueAt: due,
          softDueAt: langkah.length ? langkah[langkah.length - 1].dueAt : null,
          subtasks: { create: langkah.map((l) => ({ userId: user.id, ...l })) },
        },
      }),
    ),
  );

  const jumlahTugas = siap.length;
  const jumlahLangkah = siap.reduce((n, s) => n + s.langkah.length, 0);

  await db.coachNote.create({
    data: { userId: user.id, body: output.catatanMate.slice(0, 300) },
  });

  const durasiDetik = ((Date.now() - t0) / 1000).toFixed(1);
  revalidatePath("/", "layout");
  return {
    ok: true,
    pesan: `Selesai (${durasiDetik} dtk): ${jumlahTugas} tugas & ${jumlahLangkah} sub-langkah berhasil disusun!`,
  };
}

export async function pecahLangkahAI(
  taskId: string,
): Promise<{ ok: boolean; pesan: string; catatan?: string }> {
  const user = await getDemoUser();
  const tugas = await db.task.findFirst({
    where: { id: taskId, userId: user.id, parentId: null },
  });

  if (!tugas) return { ok: false, pesan: "Tugas tidak ditemukan." };

  const sekarang = new Date();
  const due = tugas.dueAt ?? new Date(sekarang.getTime() + 86_400_000);
  let output: z.infer<typeof pecahSatuSchema> | null = null;

  try {
    const infoModel = ambilModel();
    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.25,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(10_000),
      system: [
        "Kamu Mate, asisten produktivitas mahasiswa Indonesia.",
        "Pecah tugas berikut menjadi 3 langkah kecil konkret dalam format JSON murni.",
        JSON.stringify({
          langkah: [
            {
              judul: "Buka modul dan buat kerangka poin utama",
              estimasiMenit: 25,
              targetSelesai: "2026-10-27T19:00:00+07:00",
            },
          ],
          catatanMate: "Mulai dari langkah pertama 25 menit aja dulu bro!",
        }),
      ].join("\n"),
      prompt: `Tugas: "${tugas.title}" (${tugas.category ?? "Kuliah"})\nJSON:`,
    });

    output = ekstrakJson(text, pecahSatuSchema);
  } catch (e) {
    console.warn("[mate] pecahLangkahAI memakai Smart Step Generator:", e);
  }

  if (!output || output.langkah.length === 0) {
    const langkahKontekstual = buatLangkahKontekstual(tugas.title, due);
    output = {
      langkah: langkahKontekstual,
      catatanMate: `Tugas "${tugas.title}" sudah kubuat jadi ${langkahKontekstual.length} tahap ringan. Sikat langkah #1 dulu!`,
    };
  }

  await db.task.deleteMany({ where: { parentId: tugas.id, userId: user.id } });

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
      title: bersihkanJudul(l.judul), // <-- BERSIHKAN JUGA SUB-LANGKAH
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
    pesan: `${daftarLangkah.length} sub-langkah berhasil disusun oleh Mate!`,
    catatan: output.catatanMate.slice(0, 300),
  };
}
