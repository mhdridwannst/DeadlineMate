"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Lang } from "@/lib/i18n";

// Harus sama persis dengan nama cookie yang dibaca getBahasa() di lib/session.ts
const COOKIE_LANG = "dm_lang";

export async function setBahasa(lang: Lang) {
  // Server action bisa dipanggil siapa saja, jadi validasi inputnya.
  if (lang !== "id" && lang !== "en") return;

  const store = await cookies();
  store.set(COOKIE_LANG, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
