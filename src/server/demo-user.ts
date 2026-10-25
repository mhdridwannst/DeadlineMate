import { db } from "@/lib/db";

export async function getDemoUser() {
  return db.user.upsert({
    where: { email: "demo@deadlinemate.app" },
    update: {},
    create: { email: "demo@deadlinemate.app", name: "Demo" },
  });
}
