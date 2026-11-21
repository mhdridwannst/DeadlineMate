import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Tidak ada file." }, { status: 400 });
    }

    // Maksimal 4MB
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File maksimal 4MB." },
        { status: 400 },
      );
    }

    // Whitelist ekstensi
    const allowedExt = [
      "pdf",
      "doc",
      "docx",
      "png",
      "jpg",
      "jpeg",
      "webp",
      "txt",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
    ];

    // Whitelist MIME type (validasi ganda, jangan percaya ekstensi doang)
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!allowedExt.includes(ext) || !allowedMime.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung atau tidak valid." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const startsWith = (signature: number[]) =>
      signature.every((value, index) => bytes[index] === value);
    const validSignature =
      (ext === "pdf" && startsWith([0x25, 0x50, 0x44, 0x46])) ||
      (ext === "png" &&
        startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
      ((ext === "jpg" || ext === "jpeg") && startsWith([0xff, 0xd8, 0xff])) ||
      (ext === "webp" &&
        startsWith([0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50) ||
      ext === "txt" ||
      ((ext === "doc" || ext === "xls" || ext === "ppt") &&
        startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) ||
      ((ext === "docx" || ext === "xlsx" || ext === "pptx") &&
        startsWith([0x50, 0x4b, 0x03, 0x04]));

    if (!validSignature) {
      return NextResponse.json(
        { error: "Isi file tidak cocok dengan tipe yang diizinkan." },
        { status: 400 },
      );
    }

    // Sanitasi nama file (buang karakter aneh yang bisa bikin URL rusak)
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const userId = session.user.id;

    const blob = await put(`${userId}/${safeName}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      name: file.name, // Kirim nama asli buat display di UI
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
  }
}
