"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  await db.task.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
    },
  });
  revalidatePath("/", "layout");
}

export async function ubahStatus(
  id: string,
  selesai: boolean,
  parentId?: string | null,
) {
  const user = await getDemoUser();
  const status = selesai ? "DONE" : "TODO";
  const doneAt = selesai ? new Date() : null;

  // Jika parentId sudah diketahui (null untuk induk, string untuk sub-tugas), lewati findFirst!
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

  revalidatePath("/", "layout");
}

export async function hapusTugas(id: string) {
  const user = await getDemoUser();
  await db.task.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
}
