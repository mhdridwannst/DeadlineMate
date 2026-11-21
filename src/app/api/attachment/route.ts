import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL lampiran wajib diisi." }, { status: 400 });
  }

  const task = await db.task.findFirst({
    where: {
      userId: session.user.id,
      OR: [
        { attachmentUrl: url },
        { subtasks: { some: { attachmentUrl: url } } },
      ],
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  }

  try {
    const result = await get(url, { access: "private", useCache: false });
    if (!result) {
      return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
    }

    const stream = result.stream as unknown as ReadableStream;
    const headers = new Headers();
    headers.set(
      "Content-Type",
      result.blob.contentType || "application/octet-stream",
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="${result.blob.pathname.split("/").pop() ?? "lampiran"}"`,
    );
    headers.set("Cache-Control", "private, no-store");
    return new Response(stream, { headers });
  } catch {
    return NextResponse.json({ error: "Lampiran gagal dibuka." }, { status: 404 });
  }
}
