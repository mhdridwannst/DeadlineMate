"use server";

import { randomBytes, scryptSync } from "crypto";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { kirimEmailResetPassword } from "@/lib/email";

export type HasilAuth = { error?: string; ok?: boolean; pesan?: string } | null;

// ==================== LOGIN / REGISTER ====================
export async function loginDenganCredentials(
  _prev: HasilAuth,
  formData: FormData,
): Promise<HasilAuth> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "login");

  if (!email || !email.includes("@")) return { error: "Email tidak valid." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  if (mode === "register") {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email sudah terdaftar. Silakan masuk." };
    }

    const nama = String(formData.get("nama") ?? "").trim();
    if (nama.length < 2) return { error: "Nama panggilan minimal 2 karakter." };

    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const hashedPassword = `${salt}:${hash}`;

    await db.user.create({
      data: { email, name: nama, password: hashedPassword },
    });
  }

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

// ==================== LUPA PASSWORD ====================
export async function kirimLinkResetPassword(
  _prev: HasilAuth,
  formData: FormData,
): Promise<HasilAuth> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Email tidak valid." };
  }

  const pesanSukses = {
    ok: true,
    pesan:
      "Kalau email kamu terdaftar, kami sudah kirim link reset. Cek inbox (atau folder spam) dalam 1-2 menit.",
  };

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.password) return pesanSukses;

  try {
    await db.passwordResetToken.deleteMany({ where: { email } });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.passwordResetToken.create({
      data: { email, token, expires },
    });

    await kirimEmailResetPassword(email, token);

    return pesanSukses;
  } catch (e) {
    console.error("[reset] Gagal kirim email:", e);
    return { error: "Gagal kirim email reset. Coba lagi sebentar lagi." };
  }
}

export async function resetPasswordBaru(
  _prev: HasilAuth,
  formData: FormData,
): Promise<HasilAuth> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const konfirmasi = String(formData.get("konfirmasi") ?? "");

  if (!token) return { error: "Token tidak valid." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };
  if (password !== konfirmasi)
    return { error: "Password dan konfirmasi tidak sama." };

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken)
    return { error: "Link reset tidak valid atau sudah dipakai." };
  if (resetToken.usedAt)
    return { error: "Link reset sudah dipakai. Minta link baru." };
  if (resetToken.expires < new Date())
    return { error: "Link reset sudah kadaluwarsa. Minta link baru." };

  const user = await db.user.findUnique({ where: { email: resetToken.email } });
  if (!user) return { error: "User tidak ditemukan." };

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const hashedPassword = `${salt}:${hash}`;

  const sekarang = new Date();
  const berhasil = await db.$transaction(async (tx) => {
    const tokenTerpakai = await tx.passwordResetToken.updateMany({
      where: { token, usedAt: null, expires: { gt: sekarang } },
      data: { usedAt: sekarang },
    });
    if (tokenTerpakai.count !== 1) return false;

    await tx.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return true;
  });

  if (!berhasil)
    return {
      error: "Link reset tidak valid, kedaluwarsa, atau sudah dipakai.",
    };

  return {
    ok: true,
    pesan: "Password berhasil diubah! Silakan login dengan password baru.",
  };
}
