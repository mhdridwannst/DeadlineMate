"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/i18n";

const DEMO_EMAIL = "demo@deadlinemate.app";
const COOKIE_EMAIL = "dm_user_email";
const COOKIE_LANG = "dm_lang";

type CachedUser = {
  id: string;
  email: string;
  name: string | null;
  coachTone: "SANTAI" | "TEGAS" | "SUPPORTIVE";
  score: number;
  ts: number;
};

const globalCache = globalThis as unknown as {
  __dmUserMap?: Map<string, CachedUser>;
};

function getUserMap() {
  if (!globalCache.__dmUserMap) {
    globalCache.__dmUserMap = new Map();
  }
  return globalCache.__dmUserMap;
}

export async function invalidateUserCache(email?: string) {
  const map = getUserMap();
  if (email) {
    map.delete(email.toLowerCase());
  } else {
    map.clear();
  }
}

export const getDemoUser = cache(async () => {
  let email = DEMO_EMAIL;
  try {
    const store = await cookies();
    const saved = store.get(COOKIE_EMAIL)?.value?.trim().toLowerCase();
    if (saved && saved.includes("@")) {
      email = saved;
    }
  } catch {}

  const map = getUserMap();
  const cached = map.get(email);
  // Gunakan cache memori selama 5 menit (0ms latency!)
  if (cached && Date.now() - cached.ts < 300_000) {
    return cached;
  }

  const existing = await db.user.findUnique({
    where: { email },
  });

  if (existing) {
    const entry: CachedUser = {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      coachTone: existing.coachTone,
      score: existing.score,
      ts: Date.now(),
    };
    map.set(email, entry);
    return entry;
  }

  const defaultName =
    email === DEMO_EMAIL
      ? "Wannn"
      : email
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const created = await db.user.create({
    data: {
      email,
      name: defaultName,
    },
  });

  const entry: CachedUser = {
    id: created.id,
    email: created.email,
    name: created.name,
    coachTone: created.coachTone,
    score: created.score,
    ts: Date.now(),
  };
  map.set(email, entry);
  return entry;
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

  const updated = await db.user.upsert({
    where: { email: emailRaw },
    update: namaRaw.length >= 2 ? { name: namaDefault } : {},
    create: {
      email: emailRaw,
      name: namaDefault,
    },
  });

  getUserMap().set(emailRaw, {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    coachTone: updated.coachTone,
    score: updated.score,
    ts: Date.now(),
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
