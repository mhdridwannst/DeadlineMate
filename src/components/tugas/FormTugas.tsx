"use client";

import { useActionState, useState } from "react";
import {
  isiOtomatisTugasAI,
  simpanTugas,
  type HasilForm,
} from "@/server/tugas-form";
import { sfxAiSuccess, sfxClick, sfxDelete } from "@/lib/sfx";

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

      // Buka form advanced kalau AI berhasil isi
      setShowAdvanced(true);
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
      <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
      <input type="hidden" name="attachmentName" value={attachmentName} />

      {/* AI Auto-Fill (Smart Box) */}
      <div className="kartu-lime p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="ai-cepat" className="text-sm font-extrabold text-ink">
            Ketik atau ucapkan tugasmu
          </label>
          <span className="rounded-md border border-[color:var(--line)] bg-card px-2 py-0.5 text-[11px] font-bold text-muted">
            Speech-to-Text
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
          placeholder="Misal: Belajar & Latihan Soal Kalkulus"
          className="kolom"
        />
      </div>

      {/* Tanggal & Jam (Sejajar) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_9.5rem]">
        <div>
          <label htmlFor="f-tanggal" className="mb-1.5 block text-sm font-bold">
            Tanggal deadline{" "}
            <span className="text-[color:var(--bahaya)]">*</span>
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
            Jam
          </label>
          <input
            id="f-jam"
            name="jam"
            type="time"
            required
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            className="kolom text-sm min-h-[46px]"
          />
        </div>
      </div>

      {/* Quick Date Buttons */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => pilihTanggalCepat(0)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime transition-colors"
        >
          Hari ini
        </button>
        <button
          type="button"
          onClick={() => pilihTanggalCepat(1)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime transition-colors"
        >
          Besok
        </button>
        <button
          type="button"
          onClick={() => pilihTanggalCepat(7)}
          className="flex-1 rounded-md border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] py-1 text-[10px] font-bold hover:bg-lime transition-colors"
        >
          Minggu depan
        </button>
      </div>

      {/* Catatan (Collapsible text area) */}
      <div>
        <label
          htmlFor="f-catatan"
          className="mb-1.5 flex items-center justify-between text-sm font-bold"
        >
          <span>Catatan / Deskripsi</span>
          <span className="text-[10px] font-semibold text-muted">Opsional</span>
        </label>

        <div className="relative rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] transition-all duration-150 focus-within:bg-card focus-within:shadow-[0_4px_0_var(--sh)] focus-within:!outline-none outline-none">
          <textarea
            id="f-catatan"
            name="catatan"
            rows={3}
            maxLength={500}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Misal: Bab 3-5, link referensi, dll."
            className="block w-full resize-none bg-transparent px-3.5 pt-3 pb-11 text-sm font-semibold text-ink placeholder:text-muted/60 placeholder:font-medium !outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 border-[color:var(--line)]/10 bg-[color:var(--surface-2)]/50 px-2 py-1.5 rounded-b-[10px]">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.xls,.xlsx,.ppt,.pptx"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md border-2 border-[color:var(--line)]/30 bg-card px-2 py-1 text-[10px] font-black transition-all hover:border-[color:var(--line)] hover:-translate-y-0.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                title="Lampirkan file (max 4MB)"
              >
                {uploading ? (
                  <svg
                    className="animate-spin size-3.5 text-ink"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3.5 text-ink"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
                <span>{uploading ? "Mengunggah..." : "Lampirkan"}</span>
              </label>

              {attachmentUrl && !uploading && (
                <div className="inline-flex items-center gap-1 rounded-md border-2 border-[color:var(--biru)]/40 bg-[color:var(--biru-soft)] px-2 py-0.5 text-[10px] font-bold text-biru max-w-[180px]">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span className="truncate">{attachmentName || "file"}</span>
                  <button
                    type="button"
                    onClick={hapusAttachment}
                    aria-label="Hapus lampiran"
                    className="ml-0.5 rounded text-biru/70 hover:text-[color:var(--bahaya)] hover:bg-card transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] font-semibold text-muted">
              {catatan.length}/500
            </span>
          </div>
        </div>

        {uploadError && (
          <p className="mt-1.5 rounded-lg border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--bahaya)]">
            {uploadError}
          </p>
        )}
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

      {/* ADVANCED FIELDS (Design Sesuai Screenshot) */}
      <div
        className={`grid gap-3 overflow-hidden transition-all duration-300 ${showAdvanced ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 m-0"}`}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_10.5rem]">
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
              htmlFor="f-estimasi"
              className="mb-1.5 block text-xs font-bold"
            >
              Estimasi (jam)
            </label>
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => {
                  sfxClick();
                  setEstimasi((v) =>
                    Math.max(0.5, Number((v - 0.5).toFixed(1))),
                  );
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
                onClick={() => {
                  sfxClick();
                  setEstimasi((v) =>
                    Math.min(40, Number((v + 0.5).toFixed(1))),
                  );
                }}
                className="tombol rounded-l-none border-l-0 px-3 text-lg"
              >
                +
              </button>
            </div>
          </div>
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

      {state.error && (
        <p className="rounded-xl border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-3 py-2 text-sm font-bold text-[color:var(--bahaya)]">
          {state.error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[color:var(--line)]/10">
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
