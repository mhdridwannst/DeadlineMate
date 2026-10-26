"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

const DEMO_EMAIL = "demo@deadlinemate.app";
const COOKIE_EMAIL = "dm_user_email";
const COOKIE_LANG = "dm_lang";

export async function getDemoUser() {
  let email = DEMO_EMAIL;
  try {
    const store = await cookies();
    const saved = store.get(COOKIE_EMAIL)?.value?.trim().toLowerCase();
    if (saved && saved.includes("@")) {
      email = saved;
    }
  } catch {}

  const defaultName =
    email === DEMO_EMAIL
      ? "Wannn"
      : email
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  return db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: defaultName,
    },
  });
}

export async function getBahasa(): Promise<Lang> {
  try {
    const store = await cookies();
    const val = store.get(COOKIE_LANG)?.value;
    if (val === "en") return "en";
  } catch {}
  return "id";
}

export async function setBahasa(lang: Lang) {
  const store = await cookies();
  store.set(COOKIE_LANG, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function masukAkun(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const namaRaw = String(formData.get("nama") ?? "").trim();

  if (!emailRaw || !emailRaw.includes("@")) {
    return;
  }

  const namaDefault =
    namaRaw.length >= 2
      ? namaRaw.slice(0, 40)
      : emailRaw
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  await db.user.upsert({
    where: { email: emailRaw },
    update: namaRaw.length >= 2 ? { name: namaDefault } : {},
    create: {
      email: emailRaw,
      name: namaDefault,
    },
  });

  const store = await cookies();
  store.set(COOKIE_EMAIL, emailRaw, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

export async function keluarKeDemo() {
  const store = await cookies();
  store.delete(COOKIE_EMAIL);
  revalidatePath("/", "layout");
}
