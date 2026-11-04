"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { getDemoUser } from "./demo-user";

const buatSchema = z.object({
  title: z.string().trim().min(1).max(120),
  dueAt: z.string().min(1),
});

export async function buatTugas(formData: FormData) {
  const parsed = buatSchema.safeParse({
    title: formData.get("title"),
    dueAt: formData.get("dueAt"),
  });
  if (!parsed.success) return;

  const user = await getDemoUser();
  if (!user) throw new Error("Unauthorized");

  await db.task.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
    },
  });

  revalidatePath("/today");
  revalidatePath("/progress");
}

export async function ubahStatus(
  id: string,
  selesai: boolean,
  parentId?: string | null,
) {
  const user = await getDemoUser();
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
  const user = await getDemoUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Ambil data tugas dulu buat tau URL attachment-nya
  const task = await db.task.findUnique({
    where: { id, userId: user.id },
    select: {
      attachmentUrl: true,
      subtasks: { select: { attachmentUrl: true } },
    },
  });

  // 2. Hapus file dari Vercel Blob (kalau ada)
  if (task) {
    const urlsToDelete: string[] = [];
    if (task.attachmentUrl) urlsToDelete.push(task.attachmentUrl);
    task.subtasks.forEach((sub) => {
      if (sub.attachmentUrl) urlsToDelete.push(sub.attachmentUrl);
    });

    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete);
      } catch (e) {
        console.warn("[blob] Gagal hapus file:", e);
        // Jangan block proses hapus DB kalau file gagal dihapus
      }
    }
  }

  // 3. Hapus dari database
  await db.task.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/kalender");
}
