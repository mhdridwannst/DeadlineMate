"use client";

import { useActionState, useEffect, useState } from "react";
import {
  isiOtomatisTugasAI,
  simpanTugas,
  type HasilForm,
} from "@/server/tugas-form";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";

export type DataAwalTugas = {
  id?: string;
  judul?: string;
  tanggal?: string;
  jam?: string;
  kategori?: string;
  estimasiJam?: number;
  prioritas?: "LOW" | "MEDIUM" | "HIGH";
};

type Props = {
  awal?: DataAwalTugas;
  onSelesai?: () => void;
  onBatal?: () => void;
};

function besokDefault() {
  const d = new Date(Date.now() + 86_400_000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FormTugas({ awal, onSelesai, onBatal }: Props) {
  const [judul, setJudul] = useState(awal?.judul ?? "");
  const [tanggal, setTanggal] = useState(awal?.tanggal || besokDefault());
  const [jam, setJam] = useState(awal?.jam || "23:59");
  const [kategori, setKategori] = useState(awal?.kategori || "Kuliah");
  const [estimasi, setEstimasi] = useState<number>(awal?.estimasiJam ?? 2);
  const [prioritas, setPrioritas] = useState<"LOW" | "MEDIUM" | "HIGH">(
    awal?.prioritas ?? "MEDIUM",
  );

  const [inputCepat, setInputCepat] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [pesanAI, setPesanAI] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );
  const [rekam, setRekam] = useState(false);

  const [state, formAction, pending] = useActionState<HasilForm, FormData>(
    async (prev, fd) => {
      const hasil = await simpanTugas(prev, fd);
      if (hasil.ok) {
        sfxAiSuccess();
        onSelesai?.();
      }
      return hasil;
    },
    { ok: false },
  );

  useEffect(() => {
    if (awal) {
      setJudul(awal.judul ?? "");
      setTanggal(awal.tanggal || besokDefault());
      setJam(awal.jam || "23:59");
      setKategori(awal.kategori || "Kuliah");
      setEstimasi(awal.estimasiJam ?? 2);
      setPrioritas(awal.prioritas ?? "MEDIUM");
    }
  }, [awal]);

  function mulaiSuara() {
    sfxClick();
    const Win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
        start: () => void;
      };
    };

    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      setPesanAI({
        ok: false,
        teks: "Browser ini belum mendukung mikrofon. Ketik kalimat di atas ya!",
      });
      return;
    }

    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onstart = () => setRekam(true);
    rec.onend = () => setRekam(false);
    rec.onerror = () => setRekam(false);
    rec.onresult = (e) => {
      const hasilSuara = e.results?.[0]?.[0]?.transcript ?? "";
      if (hasilSuara) {
        setInputCepat((lama) => (lama ? `${lama} ${hasilSuara}` : hasilSuara));
      }
    };
    rec.start();
  }

  async function prosesAutoFill(kalimatOverride?: string) {
    const targetTeks = (kalimatOverride ?? inputCepat).trim();
    if (!targetTeks) {
      setPesanAI({
        ok: false,
        teks: "Ketik dulu kalimat singkat tugasmu di kotak atas.",
      });
      return;
    }
    sfxClick();
    setLoadingAI(true);
    setPesanAI(null);
    try {
      const res = await isiOtomatisTugasAI(targetTeks);
      if (!res.ok) {
        setPesanAI({ ok: false, teks: res.error });
        return;
      }
      sfxAiSuccess();
      setJudul(res.data.judul);
      setTanggal(res.data.tanggal);
      setJam(res.data.jam);
      setKategori(res.data.kategori);
      setEstimasi(res.data.estimasiJam);
      setPrioritas(res.data.prioritas);
      setPesanAI({
        ok: true,
        teks: "Kolom berhasil terisi otomatis! Cek di bawah lalu klik Simpan.",
      });
    } finally {
      setLoadingAI(false);
    }
  }

  function pilihTanggalCepat(offsetHari: number) {
    sfxClick();
    const d = new Date(Date.now() + offsetHari * 86_400_000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setTanggal(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <form action={formAction} className="space-y-4">
      {awal?.id && <input type="hidden" name="id" value={awal.id} />}

      {/* Kotak AI Auto-Fill dengan kontras teks terang & gelap sempurna */}
      <div className="kartu-lime p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="ai-cepat" className="text-sm font-extrabold text-ink">
            Ketik atau ucapkan tugasmu
          </label>
          <span className="rounded-md border border-[color:var(--line)] bg-card px-2 py-0.5 text-[11px] font-bold text-muted">
            Smart Extract
          </span>
        </div>

        <div className="flex items-stretch">
          <input
            id="ai-cepat"
            type="text"
            value={inputCepat}
            onChange={(e) => setInputCepat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void prosesAutoFill();
              }
            }}
            placeholder="mis. Belajar Kalkulus besok jam 19.00"
            className="kolom kolom-gabung bg-card text-ink"
          />
          <button
            type="button"
            onClick={mulaiSuara}
            aria-label="Ucapkan tugas dengan mikrofon"
            title="Ucapkan tugas"
            className={`tombol tombol-gabung px-3.5 ${
              rekam ? "animate-pulse bg-[color:var(--bahaya-bg)]" : ""
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          disabled={loadingAI}
          onClick={() => void prosesAutoFill()}
          className="tombol mt-2.5 w-full text-sm"
        >
          {loadingAI ? "Mengekstrak jadwal..." : "Isi otomatis dengan AI"}
        </button>

        {pesanAI && (
          <p
            className={`mt-2.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
              pesanAI.ok
                ? "border-[color:var(--santai)] bg-[color:var(--santai-bg)] text-[color:var(--santai)]"
                : "border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] text-[color:var(--bahaya)]"
            }`}
          >
            {pesanAI.teks}
          </p>
        )}
      </div>

      {/* Nama Tugas */}
      <div>
        <label htmlFor="f-judul" className="mb-1.5 block text-sm font-bold">
          Nama Tugas
        </label>
        <input
          id="f-judul"
          name="judul"
          type="text"
          required
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Misal: Belajar & Latihan Soal Kalkulus"
          className="kolom placeholder:text-muted/70"
        />
      </div>

      {/* Tanggal & Jam */}
      <div className="grid gap-3 sm:grid-cols-[1fr_9.5rem]">
        <div>
          <label htmlFor="f-tanggal" className="mb-1.5 block text-sm font-bold">
            Tanggal deadline{" "}
            <span className="text-xs font-semibold text-[color:var(--bahaya)]">
              (wajib)
            </span>
          </label>
          <input
            id="f-tanggal"
            name="tanggal"
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="kolom placeholder:text-muted/70"
          />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => pilihTanggalCepat(0)}
              className="tombol tombol-putih tombol-kecil min-h-9 text-xs"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => pilihTanggalCepat(1)}
              className="tombol tombol-putih tombol-kecil min-h-9 text-xs"
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => pilihTanggalCepat(7)}
              className="tombol tombol-putih tombol-kecil min-h-9 text-xs"
            >
              Minggu depan
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="f-jam" className="mb-1.5 block text-sm font-bold">
            Jam
          </label>
          <input
            id="f-jam"
            name="jam"
            type="time"
            required
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            className="kolom min-h-[46px]"
          />
        </div>
      </div>

      {/* Kategori & Estimasi Jam */}
      <div className="grid gap-3 sm:grid-cols-[1fr_10.5rem]">
        <div>
          <label
            htmlFor="f-kategori"
            className="mb-1.5 block text-sm font-bold"
          >
            Kategori
          </label>
          <select
            id="f-kategori"
            name="kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="kolom placeholder:text-muted/70"
          >
            <option value="Kuliah">Kuliah</option>
            <option value="Organisasi">Organisasi</option>
            <option value="Pribadi">Pribadi</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="f-estimasi"
            className="mb-1.5 block text-sm font-bold"
          >
            Estimasi (jam)
          </label>
          <div className="flex items-stretch">
            <button
              type="button"
              aria-label="Kurangi jam"
              onClick={() => {
                sfxClick();
                setEstimasi((v) => Math.max(0.5, Number((v - 0.5).toFixed(1))));
              }}
              className="tombol rounded-r-none border-r-0 px-3 text-lg"
            >
              −
            </button>
            <input
              id="f-estimasi"
              name="estimasi"
              type="number"
              step="0.5"
              min="0.5"
              max="40"
              value={estimasi}
              onChange={(e) => setEstimasi(Number(e.target.value) || 1)}
              className="kolom rounded-none text-center font-extrabold"
            />
            <button
              type="button"
              aria-label="Tambah jam"
              onClick={() => {
                sfxClick();
                setEstimasi((v) => Math.min(40, Number((v + 0.5).toFixed(1))));
              }}
              className="tombol rounded-l-none border-l-0 px-3 text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Prioritas */}
      <div>
        <label htmlFor="f-prioritas" className="mb-1.5 block text-sm font-bold">
          Prioritas
        </label>
        <select
          id="f-prioritas"
          name="prioritas"
          value={prioritas}
          onChange={(e) =>
            setPrioritas(e.target.value as "LOW" | "MEDIUM" | "HIGH")
          }
          className="kolom placeholder:text-muted/70"
        >
          <option value="HIGH">Tinggi (Mendesak)</option>
          <option value="MEDIUM">Sedang</option>
          <option value="LOW">Santai</option>
        </select>
      </div>

      {state.error && (
        <p className="rounded-xl border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-3 py-2 text-sm font-bold text-[color:var(--bahaya)]">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2">
        {onBatal && (
          <button
            type="button"
            onClick={onBatal}
            className="tombol tombol-putih px-5"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={pending || !judul.trim()}
          className="tombol px-6"
        >
          {pending ? "Menyimpan..." : "Simpan Tugas"}
        </button>
      </div>
    </form>
  );
}
