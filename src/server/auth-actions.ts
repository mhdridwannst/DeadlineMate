"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type HasilAuth = { error?: string } | null;

export async function loginDenganCredentials(
  _prev: HasilAuth,
  formData: FormData,
): Promise<HasilAuth> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "login");

  if (!email || !email.includes("@")) {
    return { error: "Email tidak valid." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  // Handle REGISTER dulu (manual)
  if (mode === "register") {
    const { db } = await import("@/lib/db");
    const { scryptSync, randomBytes } = await import("crypto");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing?.password) {
      return { error: "Email sudah terdaftar. Silakan masuk." };
    }

    const nama = String(formData.get("nama") ?? "").trim();
    if (nama.length < 2) return { error: "Nama panggilan minimal 2 karakter." };

    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const hashedPassword = `${salt}:${hash}`;

    if (existing) {
      await db.user.update({
        where: { email },
        data: { password: hashedPassword, name: nama },
      });
    } else {
      await db.user.create({
        data: { email, name: nama, password: hashedPassword },
      });
    }
  }

  // Sekarang LOGIN pakai Auth.js
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/today",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email atau password salah." };
      }
      return { error: "Terjadi kesalahan sistem." };
    }
    // Wajib: signIn() ngelempar error redirect, biarin Next.js handle
    throw error;
  }

  return null;
}

export async function loginDenganGoogle() {
  await signIn("google", { redirectTo: "/today" });
}

export async function keluarAkunBaru() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/login" });
}
