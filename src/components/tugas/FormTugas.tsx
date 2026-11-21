"use client";

import { useActionState, useState } from "react";
import {
  isiOtomatisTugasAI,
  simpanTugas,
  type HasilForm,
} from "@/server/tugas-form";
import { sfxAiSuccess, sfxClick, sfxDelete } from "@/lib/sfx";
import { Icon } from "@/components/ui/Icon";

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionConstructor {
  new (): {
    lang: string;
    interimResults: boolean;
    onstart: () => void;
    onend: () => void;
    onerror: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    start: () => void;
  };
}

type CustomWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export type DataAwalTugas = {
  id?: string;
  judul?: string;
  catatan?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
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
  const [catatan, setCatatan] = useState(awal?.catatan ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(awal?.attachmentUrl ?? "");
  const [attachmentName, setAttachmentName] = useState(
    awal?.attachmentName ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // State untuk melipat form tambahan
  const [showAdvanced, setShowAdvanced] = useState(!!awal?.id);

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    sfxClick();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload gagal.");
      }

      setAttachmentUrl(data.url);
      setAttachmentName(data.name);
      sfxAiSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload gagal.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function hapusAttachment() {
    sfxDelete();
    setAttachmentUrl("");
    setAttachmentName("");
    setUploadError(null);
  }

  function mulaiSuara() {
    sfxClick();
    const Win = window as CustomWindow;
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (!SR) {
      setPesanAI({
        ok: false,
        teks: "Browser ini belum mendukung mikrofon.",
      });
      return;
    }

    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onstart = () => setRekam(true);
    rec.onend = () => setRekam(false);
    rec.onerror = () => setRekam(false);
    rec.onresult = (e: SpeechRecognitionEvent) => {
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
        teks: "Ketik dulu kalimat singkat tugasmu.",
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

      // Buka form advanced kalau AI berhasil isi
      setShowAdvanced(true);
      setPesanAI({
        ok: true,
        teks: "Kolom berhasil terisi otomatis!",
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
      <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
      <input type="hidden" name="attachmentName" value={attachmentName} />

      {/* AI Auto-Fill (Smart Box) */}
      <div className="relative overflow-hidden rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--ai-bg)] p-3.5 shadow-[0_3px_0_var(--sh)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label
            htmlFor="ai-cepat"
            className="flex items-center gap-1.5 text-sm font-extrabold text-[color:var(--ai-ink)]"
          >
            <Icon name="sparkle" className="size-4" />
            Asisten Pintar
          </label>
          <span className="rounded border border-[color:var(--ai-ink)]/20 bg-card px-1.5 py-0.5 text-[9px] font-black text-[color:var(--ai-ink)]">
            AI & SUARA
          </span>
        </div>

        <div className="flex items-stretch gap-2">
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
            placeholder="Ketik: Belajar Kalkulus besok jam 19.00"
            className="kolom flex-1 bg-card/80 text-sm"
          />
          <button
            type="button"
            onClick={mulaiSuara}
            aria-label="Ucapkan tugas"
            className={`grid place-items-center rounded-xl border-2 border-[color:var(--line)] px-3 transition-colors ${
              rekam
                ? "bg-[color:var(--bahaya)] text-white"
                : "bg-card text-ink hover:bg-lime"
            }`}
          >
            <Icon name="mic" className="size-5" />
          </button>
        </div>

        <button
          type="button"
          disabled={loadingAI}
          onClick={() => void prosesAutoFill()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--ai-ink)]/30 bg-[color:var(--ai-ink)] py-1.5 text-xs font-bold text-white transition-all hover:bg-[color:var(--ai-ink)]/90 disabled:opacity-50"
        >
          {loadingAI ? "Mengekstrak..." : "Isi Otomatis"}
        </button>

        {pesanAI && (
          <p
            className={`mt-2 text-center text-[10px] font-bold ${pesanAI.ok ? "text-green-700" : "text-red-600"}`}
          >
            {pesanAI.teks}
          </p>
        )}
      </div>

      {/* Judul */}
      <div>
        <label htmlFor="f-judul" className="mb-1.5 block text-sm font-bold">
          Nama Tugas <span className="text-[color:var(--bahaya)]">*</span>
        </label>
        <input
          id="f-judul"
          name="judul"
          type="text"
          required
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Misal: Latihan Soal Kalkulus"
          className="kolom"
        />
      </div>

      {/* Tanggal & Jam (Sejajar) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-tanggal" className="mb-1.5 block text-sm font-bold">
            Tanggal <span className="text-[color:var(--bahaya)]">*</span>
          </label>
          <input
            id="f-tanggal"
            name="tanggal"
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="kolom text-sm"
          />
        </div>
        <div>
          <label htmlFor="f-jam" className="mb-1.5 block text-sm font-bold">
            Jam <span className="text-[color:var(--bahaya)]">*</span>
          </label>
          <input
            id="f-jam"
            name="jam"
            type="time"
            required
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            className="kolom text-sm"
          />
        </div>
      </div>

      {/* Quick Date Buttons */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => pilihTanggalCepat(0)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime"
        >
          Hari ini
        </button>
        <button
          type="button"
          onClick={() => pilihTanggalCepat(1)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime"
        >
          Besok
        </button>
        <button
          type="button"
          onClick={() => pilihTanggalCepat(7)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime"
        >
          Minggu dpn
        </button>
      </div>

      {/* Catatan (Collapsible text area) */}
      <div>
        <label
          htmlFor="f-catatan"
          className="mb-1.5 flex items-center justify-between text-sm font-bold"
        >
          <span>Catatan</span>
          <span className="text-[10px] font-semibold text-muted">Opsional</span>
        </label>
        <div className="relative rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] transition-all focus-within:bg-card focus-within:shadow-[0_3px_0_var(--sh)]">
          <textarea
            id="f-catatan"
            name="catatan"
            rows={2}
            maxLength={500}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tambahkan detail, link, atau lampiran..."
            className="block w-full resize-none bg-transparent px-3 pt-2 pb-8 text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-none"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[color:var(--line)]/10 bg-[color:var(--surface-2)]/80 px-2 py-1 rounded-b-xl">
            <div className="flex items-center gap-1">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold text-muted hover:text-ink ${uploading ? "opacity-50" : ""}`}
              >
                <Icon name="download" className="size-3 rotate-180" />
                {uploading ? "Upload..." : "Lampirkan File"}
              </label>
              {attachmentUrl && (
                <span className="ml-2 flex items-center gap-1 rounded bg-[color:var(--biru-soft)] px-1.5 text-[10px] font-bold text-biru">
                  {attachmentName}
                  <button
                    type="button"
                    onClick={hapusAttachment}
                    className="hover:text-red-500"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold text-muted">
              {catatan.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* TOGGLE ADVANCED SETTINGS */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-[color:var(--line)]/30 px-3 py-2 text-xs font-bold text-muted hover:border-[color:var(--line)] hover:text-ink transition-colors"
        >
          <span>Pengaturan Lanjutan (Prioritas, Kategori, dll)</span>
          <span className="text-lg leading-none">
            {showAdvanced ? "−" : "+"}
          </span>
        </button>
      </div>

      {/* ADVANCED FIELDS */}
      <div
        className={`grid gap-3 overflow-hidden transition-all duration-300 ${showAdvanced ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 m-0"}`}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="f-kategori"
              className="mb-1.5 block text-xs font-bold"
            >
              Kategori
            </label>
            <select
              id="f-kategori"
              name="kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="kolom text-xs"
            >
              <option value="Kuliah">Kuliah</option>
              <option value="Organisasi">Organisasi</option>
              <option value="Pribadi">Pribadi</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="f-prioritas"
              className="mb-1.5 block text-xs font-bold"
            >
              Prioritas
            </label>
            <select
              id="f-prioritas"
              name="prioritas"
              value={prioritas}
              onChange={(e) =>
                setPrioritas(e.target.value as "LOW" | "MEDIUM" | "HIGH")
              }
              className="kolom text-xs"
            >
              <option value="HIGH">Tinggi (Mendesak)</option>
              <option value="MEDIUM">Sedang</option>
              <option value="LOW">Santai</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="f-estimasi"
            className="mb-1.5 block text-xs font-bold"
          >
            Estimasi Waktu (Jam)
          </label>
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => setEstimasi((v) => Math.max(0.5, v - 0.5))}
              className="grid w-10 place-items-center rounded-l-lg border-2 border-r-0 border-[color:var(--line)] bg-[color:var(--surface-2)] font-bold"
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
              className="kolom rounded-none border-x-0 text-center font-black"
            />
            <button
              type="button"
              onClick={() => setEstimasi((v) => Math.min(40, v + 0.5))}
              className="grid w-10 place-items-center rounded-r-lg border-2 border-l-0 border-[color:var(--line)] bg-[color:var(--surface-2)] font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-100 p-2 text-xs font-bold text-red-600">
          {state.error}
        </p>
      )}

      {/* Action Buttons (Sticky di dalam form) */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-[color:var(--line)]/10">
        {onBatal && (
          <button
            type="button"
            onClick={onBatal}
            className="tombol tombol-putih px-4 text-xs"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={pending || !judul.trim()}
          className="tombol px-6 text-xs"
        >
          {pending ? "Menyimpan..." : "Simpan Tugas"}
        </button>
      </div>
    </form>
  );
}
