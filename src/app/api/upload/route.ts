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
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExt.includes(ext)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung." },
        { status: 400 },
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      name: file.name,
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Upload gagal." }, { status: 500 });
  }
}
