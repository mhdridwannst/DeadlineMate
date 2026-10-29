"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const COOKIE_EMAIL = "dm_user_email";

// ============ UTIL HASHING ============
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, "hex");
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}

// ============ SERVER ACTION ============
export type HasilAuth = { error?: string } | null;

export async function masukDenganPassword(
  _prev: HasilAuth,
  formData: FormData,
): Promise<HasilAuth> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "login"); // "login" | "register"

  // ============ VALIDASI ============
  if (!email || !email.includes("@")) {
    return { error: "Email tidak valid." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }
  if (mode === "register" && nama.length < 2) {
    return { error: "Nama panggilan minimal 2 karakter." };
  }

  // ============ REGISTER ============
  if (mode === "register") {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing && existing.password) {
      return { error: "Email sudah terdaftar. Silakan masuk." };
    }

    const hashed = hashPassword(password);

    if (existing) {
      // Upgrade akun demo lama (yang belum punya password)
      await db.user.update({
        where: { email },
        data: { password: hashed, name: nama || existing.name },
      });
    } else {
      await db.user.create({
        data: { email, name: nama, password: hashed },
      });
    }
  }

  // ============ LOGIN ============
  if (mode === "login") {
    const existing = await db.user.findUnique({ where: { email } });

    if (!existing) {
      return { error: "Akun tidak ditemukan. Silakan daftar dulu." };
    }
    if (!existing.password) {
      return {
        error:
          "Akun ini belum punya password. Silakan klik tab Daftar dengan email yang sama untuk membuat password.",
      };
    }
    if (!verifyPassword(password, existing.password)) {
      return { error: "Password salah. Coba lagi." };
    }
  }

  // ============ SET COOKIE & REDIRECT ============
  const store = await cookies();
  store.set(COOKIE_EMAIL, email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false, // agar bisa dibaca getDemoUser di client (kalau perlu)
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
  redirect("/today");
}
