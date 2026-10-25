"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDemoUser } from "@/server/demo-user";

const HARI = 86_400_000;

function izinkan() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1") {
    throw new Error("Mode demo nonaktif");
  }
}

export async function majukanHari() {
  izinkan();
  const user = await getDemoUser();
  const tugas = await db.task.findMany({
    where: { userId: user.id },
    select: { id: true, dueAt: true, softDueAt: true, doneAt: true },
  });
  const geser = (d: Date | null) => (d ? new Date(d.getTime() - HARI) : null);
  await db.$transaction(
    tugas.map((t) =>
      db.task.update({
        where: { id: t.id },
        data: {
          dueAt: geser(t.dueAt),
          softDueAt: geser(t.softDueAt),
          doneAt: geser(t.doneAt),
        },
      }),
    ),
  );
  revalidatePath("/", "layout");
}

export async function lewatiDeadline() {
  izinkan();
  const user = await getDemoUser();
  const target = await db.task.findFirst({
    where: {
      userId: user.id,
      parentId: null,
      status: { not: "DONE" },
      dueAt: { gte: new Date() },
    },
    orderBy: { dueAt: "asc" },
    select: { id: true },
  });
  if (target) {
    await db.task.update({
      where: { id: target.id },
      data: { dueAt: new Date(Date.now() - 3_600_000) },
    });
  }
  revalidatePath("/", "layout");
}
