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
  revalidatePath("/today");
}

export async function ubahStatus(id: string, selesai: boolean) {
  const user = await getDemoUser();
  const status = selesai ? "DONE" : "TODO";
  const doneAt = selesai ? new Date() : null;

  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    select: { parentId: true },
  });
  if (!task) return;

  await db.task.updateMany({
    where: { userId: user.id, OR: [{ id }, { parentId: id }] },
    data: { status, doneAt },
  });

  if (task.parentId) {
    const sisa = await db.task.count({
      where: {
        parentId: task.parentId,
        userId: user.id,
        status: { not: "DONE" },
      },
    });
    await db.task.updateMany({
      where: { id: task.parentId, userId: user.id },
      data:
        sisa === 0
          ? { status: "DONE", doneAt: new Date() }
          : { status: "TODO", doneAt: null },
    });
  }

  revalidatePath("/today");
}

export async function hapusTugas(id: string) {
  const user = await getDemoUser();
  await db.task.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/today");
}
