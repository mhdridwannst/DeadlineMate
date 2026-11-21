import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // 1. Autentikasi pengguna
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Ambil URL attachment
    const url = new URL(request.url).searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL lampiran wajib diisi." },
        { status: 400 },
      );
    }

    // 3. Validasi URL private Vercel Blob
    let blobUrl: URL;

    try {
      blobUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "URL lampiran tidak valid." },
        { status: 400 },
      );
    }

    const isPrivateBlob =
      blobUrl.protocol === "https:" &&
      blobUrl.hostname.endsWith(".private.blob.vercel-storage.com");

    if (!isPrivateBlob) {
      return NextResponse.json(
        { error: "Lampiran tidak valid." },
        { status: 404 },
      );
    }

    // 4. Pastikan file berada dalam folder pemiliknya
    const pathname = decodeURIComponent(blobUrl.pathname).replace(/^\/+/, "");

    const pemilikFile = pathname.split("/")[0];

    if (pemilikFile !== userId) {
      return NextResponse.json(
        { error: "Lampiran tidak ditemukan." },
        { status: 404 },
      );
    }

    // 5. Pastikan URL benar-benar terdaftar
    // pada tugas milik pengguna yang sedang login.
    const task = await db.task.findFirst({
      where: {
        userId,
        OR: [
          { attachmentUrl: url },
          {
            subtasks: {
              some: {
                attachmentUrl: url,
                userId,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Lampiran tidak ditemukan." },
        { status: 404 },
      );
    }

    // 6. Ambil file dari private Blob storage
    const result = await get(url, {
      access: "private",
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json(
        { error: "Lampiran tidak ditemukan." },
        { status: 404 },
      );
    }

    // 7. Siapkan response dengan security headers
    const filename = result.blob.pathname.split("/").pop() ?? "lampiran";

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    const headers = new Headers();

    headers.set(
      "Content-Type",
      result.blob.contentType || "application/octet-stream",
    );

    headers.set("Content-Disposition", `inline; filename="${safeFilename}"`);

    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, no-store");

    // 8. Kirim file ke browser
    return new Response(result.stream, { headers });
  } catch (error) {
    console.error("[attachment] Error:", error);

    return NextResponse.json(
      { error: "Lampiran gagal dibuka." },
      { status: 500 },
    );
  }
}
