"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

const COOKIE_LANG = "dm_lang";

/**
 * Ambil user dari session Auth.js, lalu join dengan data app (score, coachTone).
 * Di-cache per request biar gak query berulang.
 */
export const getDemoUser = cache(async () => {
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
      score: true,
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

export async function setBahasa(lang: Lang) {
  const store = await cookies();
  store.set(COOKIE_LANG, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
