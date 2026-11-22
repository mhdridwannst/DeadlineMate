import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

const COOKIE_LANG = "dm_lang";

/**
 * Ambil user dari session Auth.js.
 * (Diubah namanya jadi getCurrentUser biar lebih profesional).
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      coachTone: true,
      image: true,
    },
  });

  return user;
});

export const getBahasa = cache(async (): Promise<Lang> => {
  try {
    const store = await cookies();
    const val = store.get(COOKIE_LANG)?.value;
    if (val === "en") return "en";
  } catch {}
  return "id";
});
