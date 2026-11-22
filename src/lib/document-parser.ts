import "server-only";

import { OfficeParser } from "officeparser";

export type DocumentFormat = "pdf" | "docx" | "pptx" | "xlsx" | "txt";

export type ParsedDocument = {
  fileName: string;
  format: DocumentFormat;
  text: string;
  characterCount: number;
  truncated: boolean;
  warnings: string[];
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_TEXT_LENGTH = 50_000;

const SUPPORTED_FORMATS: DocumentFormat[] = [
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "txt",
];

function getDocumentFormat(fileName: string): DocumentFormat {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || !SUPPORTED_FORMATS.includes(extension as DocumentFormat)) {
    throw new Error(
      "Format dokumen tidak didukung. Gunakan PDF, DOCX, PPTX, XLSX, atau TXT.",
    );
  }

  return extension as DocumentFormat;
}

function cleanExtractedText(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPlainText(buffer: Buffer): string {
  try {
    const decoder = new TextDecoder("utf-8", {
      fatal: true,
    });

    return decoder.decode(buffer);
  } catch {
    throw new Error("File TXT harus menggunakan encoding UTF-8 yang valid.");
  }
}

async function extractOfficeText(
  buffer: Buffer,
): Promise<{ text: string; warnings: string[] }> {
  const ast = await OfficeParser.parseOffice(buffer, {
    extractAttachments: true,

    // Aktifkan OCR pada gambar yang terdapat dalam dokumen.
    ocr: true,

    ocrConfig: {
      language: "ind+eng",
      preserveLayout: true,

      timeout: {
        workerLoad: 30_000,
        recognition: 15_000,
        autoTerminate: 10_000,
      },
    },

    abortSignal: AbortSignal.timeout(60_000),

    ignoreComments: true,
    ignoreNotes: false,
    ignoreHeadersAndFooters: false,
  });

  // Masukkan teks hasil OCR, bukan hanya placeholder gambar.
  const result = await ast.to("text", {
    includeImages: "ocr-text-only",
  });

  if (typeof result.value !== "string") {
    throw new Error("Parser tidak menghasilkan teks yang dapat dibaca.");
  }

  // Ambil peringatan dari proses parsing dokumen.
  const warnings = (ast.warnings ?? []).map((issue) => {
    return `${issue.code}: ${issue.message}`;
  });

  return {
    text: result.value,
    warnings,
  };
}

/**
 * Ekstraksi teks dokumen untuk AI Document Understanding.
 *
 * Format:
 * - PDF
 * - DOCX
 * - PPTX
 * - XLSX
 * - TXT
 *
 * OCR dijalankan pada gambar yang diekstrak dari dokumen.
 */
export async function parseDocument(
  buffer: Buffer,
  fileName: string,
): Promise<ParsedDocument> {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Data dokumen tidak valid.");
  }

  if (buffer.length === 0) {
    throw new Error("Dokumen kosong.");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Ukuran dokumen maksimal 4 MB.");
  }

  const format = getDocumentFormat(fileName);

  let extractedText: string;
  let warnings: string[] = [];

  if (format === "txt") {
    extractedText = extractPlainText(buffer);
  } else {
    const result = await extractOfficeText(buffer);

    extractedText = result.text;
    warnings = result.warnings;
  }

  const cleanedText = cleanExtractedText(extractedText);

  if (!cleanedText) {
    throw new Error(
      "Tidak ditemukan teks yang dapat dibaca. " +
        "Pastikan dokumen tidak kosong atau gunakan OCR untuk dokumen hasil scan.",
    );
  }

  const truncated = cleanedText.length > MAX_TEXT_LENGTH;

  const finalText = truncated
    ? cleanedText.slice(0, MAX_TEXT_LENGTH)
    : cleanedText;

  return {
    fileName,
    format,
    text: finalText,
    characterCount: finalText.length,
    truncated,
    warnings,
  };
}
