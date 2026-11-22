"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { urlLampiranMilikUser } from "@/lib/attachment-url";

export async function ubahStatus(
  id: string,
  selesai: boolean,
  parentId?: string | null,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const status = selesai ? "DONE" : "TODO";
  const doneAt = selesai ? new Date() : null;

  // Kalau parentId udah diketahui, skip findFirst
  let idInduk = parentId;
  if (idInduk === undefined) {
    const task = await db.task.findFirst({
      where: { id, userId: user.id },
      select: { parentId: true },
    });
    if (!task) return;
    idInduk = task.parentId;
  }

  await db.task.updateMany({
    where: { userId: user.id, OR: [{ id }, { parentId: id }] },
    data: { status, doneAt },
  });

  if (idInduk) {
    const sisa = await db.task.count({
      where: {
        parentId: idInduk,
        userId: user.id,
        status: { not: "DONE" },
      },
    });
    await db.task.updateMany({
      where: { id: idInduk, userId: user.id },
      data:
        sisa === 0
          ? { status: "DONE", doneAt: new Date() }
          : { status: "TODO", doneAt: null },
    });
  }

  revalidatePath("/today");
  revalidatePath("/progress");
}

export async function hapusTugas(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Ambil URL lampiran dulu (subtask ikut terhapus lewat cascade).
  const task = await db.task.findUnique({
    where: { id, userId: user.id },
    select: {
      attachmentUrl: true,
      subtasks: { select: { attachmentUrl: true } },
    },
  });

  // 2. Hapus dari database lebih dulu: kalau gagal, file belum ikut hilang.
  await db.task.deleteMany({ where: { id, userId: user.id } });

  // 3. Hapus file dari Vercel Blob. Hanya URL milik user ini yang disentuh.
  if (task) {
    const urlsToDelete = [
      task.attachmentUrl,
      ...task.subtasks.map((sub) => sub.attachmentUrl),
    ].filter(
      (url): url is string => !!url && urlLampiranMilikUser(url, user.id),
    );

    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete);
      } catch (e) {
        // File yatim lebih ringan daripada tugas yang gagal dihapus.
        console.warn("[blob] Gagal hapus file:", e);
      }
    }
  }

  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");
}
