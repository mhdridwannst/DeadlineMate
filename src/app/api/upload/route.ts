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

    if (!file) {
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

    // Sanitasi nama file (buang karakter aneh yang bisa bikin URL rusak)
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const blob = await put(safeName, file, {
      access: "public",
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
