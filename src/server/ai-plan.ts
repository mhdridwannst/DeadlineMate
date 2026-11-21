"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ambilModel } from "@/lib/ai/model";
import { dayKey, hariKe, tambahHari, keDueAt } from "@/lib/waktu";
import { getDemoUser } from "./demo-user";
import { cekRateLimit } from "@/lib/rate-limit";

export type HasilRencana = { ok: boolean; pesan: string } | null;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Semua timestamp dari AI harus menyertakan timezone (Z atau offset).
 * Contoh: 2026-11-25T23:59:00+07:00.
 */
function timestampWajibTimezoneValid(value: string): boolean {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/,
  );

  if (!match) return false;

  const [
    ,
    yearRaw,
    monthRaw,
    dayRaw,
    hourRaw,
    minuteRaw,
    secondRaw,
    zone,
    ,
    offsetHourRaw,
    offsetMinuteRaw,
  ] = match;
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw);

  const dateOnly = `${yearRaw}-${monthRaw}-${dayRaw}`;
  const parsedDate = new Date(`${dateOnly}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateOnly
  ) {
    return false;
  }

  if (hour > 23 || minute > 59 || second > 59) return false;

  if (zone !== "Z") {
    const offsetHour = Number(offsetHourRaw);
    const offsetMinute = Number(offsetMinuteRaw);
    if (
      offsetHour > 14 ||
      offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      return false;
    }
  }

  return Number.isFinite(Date.parse(value));
}

const timestampSchema = z
  .string()
  .refine(
    timestampWajibTimezoneValid,
    "Timestamp harus valid dan menyertakan timezone.",
  );

const kategoriSchema = z.enum(["Kuliah", "Organisasi", "Pribadi"]);

const langkahSchema = z.object({
  judul: z.string().trim().min(3).max(120),
  estimasiMenit: z.number().int().min(10).max(480),
  targetSelesai: timestampSchema,
});

const rencanaSchema = z
  .object({
    tugas: z
      .array(
        z.object({
          judul: z.string().trim().min(3).max(120),
          tenggat: timestampSchema,
          kategori: kategoriSchema,
          prioritas: z.enum(["LOW", "MEDIUM", "HIGH"]),
          estimasiMenit: z.number().int().min(15).max(2400),
          langkah: z.array(langkahSchema).min(1).max(5),
        }),
      )
      .min(1)
      .max(8),
    catatanMate: z.string().trim().min(1).max(300),
  })
  .superRefine((value, ctx) => {
    for (const [taskIndex, task] of value.tugas.entries()) {
      const due = Date.parse(task.tenggat);
      let previousTarget = Number.NEGATIVE_INFINITY;

      for (const [stepIndex, step] of task.langkah.entries()) {
        const target = Date.parse(step.targetSelesai);

        if (target > due) {
          ctx.addIssue({
            code: "custom",
            message: "Target subtask melewati tenggat tugas.",
            path: ["tugas", taskIndex, "langkah", stepIndex, "targetSelesai"],
          });
        }

        if (target < previousTarget) {
          ctx.addIssue({
            code: "custom",
            message: "Urutan target subtask harus kronologis.",
            path: ["tugas", taskIndex, "langkah", stepIndex, "targetSelesai"],
          });
        }

        previousTarget = target;
      }
    }
  });

const pecahSatuSchema = z.object({
  langkah: z.array(langkahSchema).min(1).max(5),
  catatanMate: z.string().trim().min(1).max(300),
});

type RencanaData = z.infer<typeof rencanaSchema>;
type PecahData = z.infer<typeof pecahSatuSchema>;

function ekstrakJson<T>(teksMentah: string, skema: z.ZodType<T>): T | null {
  const awal = teksMentah.indexOf("{");
  const akhir = teksMentah.lastIndexOf("}");

  if (awal === -1 || akhir === -1 || akhir <= awal) return null;

  try {
    const objek: unknown = JSON.parse(teksMentah.slice(awal, akhir + 1));
    const hasil = skema.safeParse(objek);
    return hasil.success ? hasil.data : null;
  } catch {
    return null;
  }
}

function bersihkanJudul(judul: string): string {
  return judul
    .replace(/^(?:\d+[.)]|[-*•])\s*/, "")
    .replace(/^(?:\d+\s+)/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function selisihHariKalender(dari: string, ke: string): number {
  const awal = Date.parse(`${dari}T00:00:00Z`);
  const akhir = Date.parse(`${ke}T00:00:00Z`);
  return Math.round((akhir - awal) / MILLISECONDS_PER_DAY);
}

function buatLangkahKontekstual(judul: string, due: Date) {
  const lower = judul.toLowerCase();
  const now = Date.now();
  const batasAkhir = due.getTime();
  const rentang = Math.max(0, batasAkhir - now);

  let template: { judul: string; estimasiMenit: number }[];

  if (
    /\b(laprak|praktikum|laboratorium|percobaan|sinyal|elektronika|kimia|fisika)\b/.test(
      lower,
    )
  ) {
    template = [
      {
        judul: "Rekap tabel data hasil pengamatan dan gambar rangkaian",
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
        judul: "Kerjakan lima soal latihan dasar untuk pemanasan konsep",
        estimasiMenit: 45,
      },
      {
        judul: "Selesaikan soal tingkat lanjut dan periksa kembali jawaban",
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
        judul: "Kumpulkan referensi utama dan buat kerangka outline",
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
        judul: "Implementasikan logika utama dan integrasi antarmuka",
        estimasiMenit: 60,
      },
      {
        judul: "Uji skenario error dan rapikan tampilan",
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
        judul: `Kerjakan bagian inti dari ${judul} tanpa distraksi`,
        estimasiMenit: 45,
      },
      {
        judul: "Periksa kembali hasil akhir dan tandai selesai",
        estimasiMenit: 20,
      },
    ];
  }

  return template.map((item, index) => {
    const targetMs = now + (rentang * (index + 1)) / (template.length + 1);

    return {
      judul: item.judul,
      estimasiMenit: item.estimasiMenit,
      targetSelesai: new Date(targetMs).toISOString(),
    };
  });
}

function susunRencanaLokal(teks: string): RencanaData {
  // Jangan pisahkan berdasarkan kata "dan": kata tersebut sering menjadi
  // bagian dari satu nama tugas, misalnya "Algoritma dan Struktur Data".
  const potongan = teks
    .split(/(?:,|\n|;)+/)
    .map((bagian) => bagian.trim())
    .filter((bagian) => bagian.length >= 4)
    .slice(0, 6);

  const daftar = (potongan.length > 0 ? potongan : [teks.trim()]).map(
    (kalimat) => {
      const lower = kalimat.toLowerCase();
      const now = new Date();
      const hariIni = dayKey(now);
      const hariSekarang = hariKe(hariIni);
      let offsetHari = 2;
      let due: Date | null = null;

      const matchMenitRelatif = lower.match(
        /\b(?:dalam\s*)?(\d+)\s*menit\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/,
      );
      const matchJamRelatif = lower.match(
        /\b(?:dalam\s*)?(\d+)\s*jam\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/,
      );

      if (matchMenitRelatif) {
        const menit = Math.min(
          525600,
          Number.parseInt(matchMenitRelatif[1], 10),
        );
        due = new Date(now.getTime() + menit * 60_000);
        offsetHari = selisihHariKalender(hariIni, dayKey(due));
      } else if (matchJamRelatif) {
        const jam = Math.min(8760, Number.parseInt(matchJamRelatif[1], 10));
        due = new Date(now.getTime() + jam * 3_600_000);
        offsetHari = selisihHariKalender(hariIni, dayKey(due));
      }

      if (!due) {
        if (/\b(hari ini|malam ini|sore ini|pagi ini|sekarang)\b/.test(lower)) {
          offsetHari = 0;
        } else if (/\blusa\b/.test(lower)) {
          offsetHari = 2;
        } else if (/\bbesok\b/.test(lower)) {
          offsetHari = 1;
        } else if (/\b(mingdep|minggu depan|pekan depan)\b/.test(lower)) {
          offsetHari = 7;
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

          for (const [namaHari, indexHari] of Object.entries(petaHari)) {
            const polaHari = new RegExp(`\\b${namaHari}\\b`, "i");
            if (!polaHari.test(lower)) continue;

            const selisih = (indexHari - hariSekarang + 7) % 7;
            offsetHari = selisih === 0 ? 7 : selisih;
            break;
          }
        }
      }

      due ??= keDueAt(tambahHari(hariIni, offsetHari), "23:59");

      // Jangan membuat fallback dengan deadline yang sudah lewat.
      if (due.getTime() <= Date.now()) {
        due = keDueAt(tambahHari(dayKey(new Date()), 1), "23:59");
        offsetHari = Math.max(1, offsetHari);
      }

      const judulBersih = kalimat
        .replace(
          /\b(?:dalam\s*)?\d+\s*(?:jam|menit|hari)\s*(?:dari\s*sekarang|lagi|kedepan|ke\s*depan)\b/gi,
          "",
        )
        .replace(
          /\b(kumpul|dikumpul|dikumpulkan|deadline|tenggat|hari ini|besok|lusa|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|depan|jam\s*\d{1,2}(?:[.:]\d{2})?)\b/gi,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();

      const finalJudul = (
        judulBersih.length >= 3 ? judulBersih : kalimat
      ).replace(/^./, (karakter) => karakter.toUpperCase());

      const judulFinalBersih = bersihkanJudul(finalJudul) || "Tugas baru";
      const langkah = buatLangkahKontekstual(judulFinalBersih, due);
      const totalMenit = langkah.reduce(
        (total, item) => total + item.estimasiMenit,
        0,
      );

      let kategori: z.infer<typeof kategoriSchema> = "Kuliah";
      if (/\b(ukm|rapat|organisasi|panitia|hima|bem)\b/.test(lower)) {
        kategori = "Organisasi";
      } else if (
        /\b(beli|olahraga|gym|rumah|pribadi|laundry|jalan|tidur|nonton)\b/.test(
          lower,
        )
      ) {
        kategori = "Pribadi";
      }

      const prioritas: "LOW" | "MEDIUM" | "HIGH" =
        offsetHari <= 2 ? "HIGH" : offsetHari <= 4 ? "MEDIUM" : "LOW";

      return {
        judul: judulFinalBersih,
        tenggat: due.toISOString(),
        kategori,
        prioritas,
        estimasiMenit: totalMenit,
        langkah,
      };
    },
  );

  const langkahPertama = daftar[0].langkah[0];

  return {
    tugas: daftar,
    catatanMate:
      `Rencanamu sudah dibagi menjadi langkah-langkah kecil. ` +
      `Mulai dari "${langkahPertama.judul}" selama ` +
      `${langkahPertama.estimasiMenit} menit.`,
  };
}

function jadwalMasukAkal(data: RencanaData, sekarangMs = Date.now()): boolean {
  return data.tugas.every((tugas) => {
    const dueMs = Date.parse(tugas.tenggat);
    if (!Number.isFinite(dueMs) || dueMs <= sekarangMs) return false;

    let targetSebelumnya = Number.NEGATIVE_INFINITY;

    return tugas.langkah.every((langkah) => {
      const targetMs = Date.parse(langkah.targetSelesai);
      const valid =
        Number.isFinite(targetMs) &&
        targetMs >= sekarangMs &&
        targetMs <= dueMs &&
        targetMs >= targetSebelumnya;

      targetSebelumnya = targetMs;
      return valid;
    });
  });
}

function langkahSubtaskMasukAkal(
  data: PecahData,
  sekarangMs: number,
  dueMs: number,
): boolean {
  let targetSebelumnya = Number.NEGATIVE_INFINITY;

  return data.langkah.every((langkah) => {
    const targetMs = Date.parse(langkah.targetSelesai);
    const valid =
      Number.isFinite(targetMs) &&
      targetMs >= sekarangMs &&
      targetMs <= dueMs &&
      targetMs >= targetSebelumnya;

    targetSebelumnya = targetMs;
    return valid;
  });
}

export async function rencanakan(
  _prev: HasilRencana,
  formData: FormData,
): Promise<HasilRencana> {
  const teks = String(formData.get("teks") ?? "").trim();

  if (teks.length < 4) {
    return { ok: false, pesan: "Tulis dulu tugasnya, minimal satu kalimat." };
  }

  if (teks.length > 1500) {
    return { ok: false, pesan: "Terlalu panjang. Maksimal 1500 karakter." };
  }

  const user = await getDemoUser();
  if (!user) {
    return { ok: false, pesan: "Sesi berakhir. Silakan login kembali." };
  }

  const aiLimit = await cekRateLimit(
    "ai-plan",
    user.id,
    20,
    MILLISECONDS_PER_DAY,
  );

  if (!aiLimit.allowed) {
    return { ok: false, pesan: "Batas penggunaan AI harian sudah tercapai." };
  }

  const sekarang = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const sekarangMs = Date.now();
  const t0 = Date.now();
  let output: RencanaData | null = null;

  try {
    const infoModel = ambilModel();
    const contohDue = keDueAt(tambahHari(dayKey(new Date()), 2), "23:59");
    const contohLangkah = new Date(
      Date.now() + (contohDue.getTime() - Date.now()) / 2,
    );

    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.2,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(12_000),
      system: [
        "Kamu Mate, AI accountability partner mahasiswa Indonesia.",
        `Sekarang: ${sekarang} (WIB, UTC+7).`,
        "Ubah deskripsi pengguna menjadi JSON jadwal tugas terstruktur.",
        "Jangan mengarang deadline yang sudah lewat.",
        "Semua timestamp wajib ISO 8601 dengan timezone, gunakan offset +07:00 untuk WIB.",
        "Target subtask harus berurutan secara kronologis dan tidak boleh melewati deadline tugas.",
        "Maksimal 8 tugas dan maksimal 5 langkah untuk setiap tugas.",
        "Kategori hanya boleh Kuliah, Organisasi, atau Pribadi.",
        "Estimasi harus berupa bilangan bulat dalam satuan menit.",
        JSON.stringify({
          tugas: [
            {
              judul: "Laporan Praktikum Kimia",
              tenggat: contohDue.toISOString(),
              kategori: "Kuliah",
              prioritas: "HIGH",
              estimasiMenit: 115,
              langkah: [
                {
                  judul: "Rekap tabel data hasil pengamatan",
                  estimasiMenit: 35,
                  targetSelesai: contohLangkah.toISOString(),
                },
              ],
            },
          ],
          catatanMate:
            "Mulai dari langkah pertama agar tugas selesai tepat waktu.",
        }),
        "Kembalikan JSON saja tanpa markdown atau penjelasan tambahan.",
      ].join("\n"),
      prompt: `Deskripsi tugas pengguna:\n"""\n${teks}\n"""\n\nJSON:`,
    });

    const hasilAI = ekstrakJson(text, rencanaSchema);
    if (hasilAI && jadwalMasukAkal(hasilAI, sekarangMs)) {
      output = hasilAI;
    }
  } catch (error) {
    console.warn("[mate] AI planner beralih ke Smart Engine Lokal:", error);
  }

  if (!output) {
    output = susunRencanaLokal(teks);
  }

  // Validasi ulang hasil fallback sebelum menyentuh database.
  const hasilAkhir = rencanaSchema.safeParse(output);
  if (!hasilAkhir.success || !jadwalMasukAkal(hasilAkhir.data, Date.now())) {
    return {
      ok: false,
      pesan:
        "Mate belum bisa membuat jadwal yang valid. Periksa deskripsi dan deadline tugas, lalu coba lagi.",
    };
  }

  const siap = hasilAkhir.data.tugas.map((tugas) => {
    const due = new Date(tugas.tenggat);
    const langkah = tugas.langkah.map((langkah) => ({
      title: bersihkanJudul(langkah.judul),
      estimateMin: langkah.estimasiMenit,
      dueAt: new Date(langkah.targetSelesai),
    }));

    return {
      tugas,
      due,
      langkah,
      judulBersih: bersihkanJudul(tugas.judul) || tugas.judul,
    };
  });

  if (siap.length === 0) {
    return {
      ok: false,
      pesan: "Mate tidak menghasilkan tugas yang bisa disimpan.",
    };
  }

  const jumlahTugas = siap.length;
  const jumlahLangkah = siap.reduce(
    (total, item) => total + item.langkah.length,
    0,
  );

  // Semua tugas, subtask, dan catatan Mate disimpan atomik.
  try {
    await db.$transaction(async (tx) => {
      for (const item of siap) {
        await tx.task.create({
          data: {
            userId: user.id,
            title: item.judulBersih,
            category: item.tugas.kategori,
            priority: item.tugas.prioritas,
            estimateMin: item.tugas.estimasiMenit,
            dueAt: item.due,
            softDueAt: item.langkah[item.langkah.length - 1]?.dueAt ?? null,
            subtasks: {
              create: item.langkah.map((langkah) => ({
                userId: user.id,
                ...langkah,
              })),
            },
          },
        });
      }

      await tx.coachNote.create({
        data: {
          userId: user.id,
          body: hasilAkhir.data.catatanMate.slice(0, 300),
        },
      });
    });
  } catch (error) {
    console.error("[mate] Gagal menyimpan rencana AI:", error);
    return {
      ok: false,
      pesan:
        "Rencana gagal disimpan. Tidak ada perubahan yang diterapkan. Silakan coba lagi.",
    };
  }

  const durasiDetik = ((Date.now() - t0) / 1000).toFixed(1);

  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");

  return {
    ok: true,
    pesan: `Selesai (${durasiDetik} dtk): ${jumlahTugas} tugas & ${jumlahLangkah} sub-langkah berhasil disusun!`,
  };
}

export async function pecahLangkahAI(
  taskId: string,
): Promise<{ ok: boolean; pesan: string; catatan?: string }> {
  if (!taskId || taskId.length > 100) {
    return { ok: false, pesan: "ID tugas tidak valid." };
  }

  const user = await getDemoUser();
  if (!user) {
    return { ok: false, pesan: "Sesi berakhir. Silakan login kembali." };
  }

  const tugas = await db.task.findFirst({
    where: { id: taskId, userId: user.id, parentId: null },
  });

  if (!tugas) {
    return { ok: false, pesan: "Tugas tidak ditemukan." };
  }

  // Pemeriksaan awal menghindari pemanggilan AI yang tidak diperlukan.
  const subtaskAda = await db.task.findFirst({
    where: {
      parentId: tugas.id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (subtaskAda) {
    return {
      ok: false,
      pesan:
        "Tugas sudah memiliki sub-langkah. Progres yang ada dipertahankan dan tidak ditimpa oleh AI.",
    };
  }

  const sekarang = new Date();
  const due =
    tugas.dueAt ?? new Date(sekarang.getTime() + MILLISECONDS_PER_DAY);

  if (due.getTime() <= sekarang.getTime()) {
    return {
      ok: false,
      pesan:
        "Deadline tugas sudah lewat. Perbarui deadline terlebih dahulu sebelum membuat rencana baru.",
    };
  }

  const aiLimit = await cekRateLimit(
    "ai-subtask",
    user.id,
    30,
    MILLISECONDS_PER_DAY,
  );

  if (!aiLimit.allowed) {
    return {
      ok: false,
      pesan: "Batas penggunaan AI sub-langkah harian sudah tercapai.",
    };
  }

  const sekarangMs = sekarang.getTime();
  let output: PecahData | null = null;

  try {
    const infoModel = ambilModel();
    const contohTarget = new Date(
      sekarangMs + (due.getTime() - sekarangMs) / 2,
    );

    const { text } = await generateText({
      model: infoModel.model,
      temperature: 0.2,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(10_000),
      system: [
        "Kamu Mate, asisten produktivitas mahasiswa Indonesia.",
        "Pecah tugas menjadi 3 sampai 5 langkah kecil dan konkret dalam JSON.",
        `Waktu sekarang: ${sekarang.toISOString()}.`,
        `Deadline tugas: ${due.toISOString()}.`,
        "Semua timestamp harus ISO 8601 dengan timezone eksplisit.",
        "Target setiap langkah harus berada setelah waktu sekarang dan tidak boleh melewati deadline tugas.",
        "Urutkan target langkah dari yang paling awal sampai paling akhir.",
        JSON.stringify({
          langkah: [
            {
              judul: "Buka modul dan buat kerangka poin utama",
              estimasiMenit: 25,
              targetSelesai: contohTarget.toISOString(),
            },
          ],
          catatanMate: "Mulai dari langkah pertama selama 25 menit.",
        }),
        "Kembalikan JSON saja tanpa markdown.",
      ].join("\n"),
      prompt: `Tugas: """${tugas.title}"""\nKategori: ${tugas.category ?? "Kuliah"}\nJSON:`,
    });

    output = ekstrakJson(text, pecahSatuSchema);
  } catch (error) {
    console.warn(
      "[mate] AI gagal membuat subtask, memakai fallback lokal:",
      error,
    );
  }

  if (!output || !langkahSubtaskMasukAkal(output, sekarangMs, due.getTime())) {
    const langkahKontekstual = buatLangkahKontekstual(tugas.title, due);
    output = {
      langkah: langkahKontekstual,
      catatanMate:
        `Tugas "${tugas.title}" dibagi menjadi ` +
        `${langkahKontekstual.length} tahap. Mulai dari langkah pertama.`,
    };
  }

  const daftarLangkah = output.langkah.map((langkah) => ({
    userId: user.id,
    parentId: tugas.id,
    title: bersihkanJudul(langkah.judul),
    estimateMin: langkah.estimasiMenit,
    dueAt: new Date(langkah.targetSelesai),
  }));

  // Lock baris tugas induk agar dua request bersamaan tidak dapat membuat
  // atau menimpa subtask untuk tugas yang sama. Tidak ada penghapusan subtask.
  let hasilSimpan: "not-found" | "already-exists" | "created";

  try {
    hasilSimpan = await db.$transaction(async (tx) => {
      const parentLocked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Task"
        WHERE "id" = ${tugas.id}
          AND "userId" = ${user.id}
          AND "parentId" IS NULL
        FOR UPDATE
      `;

      if (parentLocked.length === 0) {
        return "not-found" as const;
      }

      const childExists = await tx.task.findFirst({
        where: {
          parentId: tugas.id,
          userId: user.id,
        },
        select: { id: true },
      });

      if (childExists) {
        return "already-exists" as const;
      }

      await tx.task.createMany({ data: daftarLangkah });

      await tx.coachNote.create({
        data: {
          userId: user.id,
          taskId: tugas.id,
          body: output.catatanMate.slice(0, 300),
        },
      });

      return "created" as const;
    });
  } catch (error) {
    console.error("[mate] Gagal menyimpan subtask AI:", error);
    return {
      ok: false,
      pesan:
        "Sub-langkah gagal disimpan. Data tugas sebelumnya tetap dipertahankan.",
    };
  }

  if (hasilSimpan === "not-found") {
    return { ok: false, pesan: "Tugas tidak ditemukan atau sudah dihapus." };
  }

  if (hasilSimpan === "already-exists") {
    return {
      ok: false,
      pesan:
        "Sub-langkah baru saja dibuat oleh proses lain. Progres yang sudah ada tetap dipertahankan.",
    };
  }

  revalidatePath("/today");
  revalidatePath("/progress");

  return {
    ok: true,
    pesan: `${daftarLangkah.length} sub-langkah berhasil disusun oleh Mate!`,
    catatan: output.catatanMate.slice(0, 300),
  };
}
