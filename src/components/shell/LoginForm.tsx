"use client";

import { useActionState, useState } from "react";
import {
  loginDenganCredentials,
  loginDenganGoogle,
  type HasilAuth,
} from "@/server/auth-actions";
import { Icon } from "@/components/ui/Icon";

type Lang = "id" | "en";

export default function LoginForm({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [state, formAction, pending] = useActionState<HasilAuth, FormData>(
    loginDenganCredentials,
    null,
  );

  const t = {
    id: {
      tabLogin: "Masuk",
      tabRegister: "Daftar",
      titleLogin: "Selamat datang kembali",
      titleRegister: "Buat akun baru",
      descLogin: "Masukkan email dan password untuk melanjutkan progresmu.",
      descRegister:
        "Cukup nama, email, dan password. Progres dan XP-mu tersimpan aman.",
      labelNama: "Nama panggilan",
      placeholderNama: "Mis. Go Yoon Jung",
      labelEmail: "Email",
      placeholderEmail: "nama@gmail.com",
      labelPassword: "Password",
      placeholderPassword: "Minimal 6 karakter",
      btnLogin: "Masuk",
      btnRegister: "Buat Akun",
      loading: "Memproses...",
      privacy: "Emailmu dipakai hanya untuk mengenali akunmu.",
      googleBtn: "Lanjutkan dengan Google",
      divider: "atau pakai email",
    },
    en: {
      tabLogin: "Sign In",
      tabRegister: "Register",
      titleLogin: "Welcome back",
      titleRegister: "Create new account",
      descLogin: "Enter your email and password to continue your progress.",
      descRegister:
        "Just name, email, and password. Your progress and XP are safely saved.",
      labelNama: "Nickname",
      placeholderNama: "e.g. Go Yoon Jung",
      labelEmail: "Email",
      placeholderEmail: "name@gmail.com",
      labelPassword: "Password",
      placeholderPassword: "Min 6 characters",
      btnLogin: "Sign In",
      btnRegister: "Create Account",
      loading: "Processing...",
      privacy: "Your email is only used to identify your account.",
      googleBtn: "Continue with Google",
      divider: "or use email",
    },
  }[lang];

  const isLogin = mode === "login";

  return (
    <div className="kartu p-6 sm:p-8 relative">
      {/* ================= LOGO ================= */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="relative">
          <span className="grid size-20 -rotate-3 cursor-default place-items-center rounded-2xl border-2 border-[#111] bg-lime text-4xl font-black text-[#111] shadow-[0_4px_0_var(--sh)] transition-transform hover:rotate-0">
            D
          </span>
          <span className="absolute -bottom-2 -right-3 rotate-6 rounded-lg border-2 border-[#111] bg-white px-2 py-0.5 text-xs font-black text-[#111] shadow-[0_2px_0_var(--sh)]">
            BETA
          </span>
        </div>
        <p className="mt-4 text-3xl font-black tracking-tight text-ink">
          Deadline Mate
        </p>
      </div>

      {/* ================= TABS (Masuk / Daftar) ================= */}
      <div className="mb-6 flex rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-xs font-black transition-all ${
            isLogin
              ? "border-2 border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
              : "text-muted hover:text-ink"
          }`}
        >
          {t.tabLogin}
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-lg py-2 text-xs font-black transition-all ${
            !isLogin
              ? "border-2 border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
              : "text-muted hover:text-ink"
          }`}
        >
          {t.tabRegister}
        </button>
      </div>

      {/* ================= HEADER TEKS ================= */}
      <h2 className="text-xl font-extrabold text-ink">
        {isLogin ? t.titleLogin : t.titleRegister}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {isLogin ? t.descLogin : t.descRegister}
      </p>

      {/* ================= TOMBOL GOOGLE OAUTH ================= */}
      <form action={loginDenganGoogle} className="mt-5">
        <button type="submit" className="relative w-full group">
          <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1 transition-transform group-hover:translate-y-1.5 group-active:translate-y-0" />
          <div className="relative flex items-center justify-center gap-2 w-full bg-card text-ink border-2 border-[#111] rounded-xl py-3 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5">
            {/* Ikon Google Resmi */}
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t.googleBtn}
          </div>
        </button>
      </form>

      {/* ================= DIVIDER ================= */}
      <div className="relative mt-6 mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-dashed border-[color:var(--line)]/30"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[10px] font-black uppercase tracking-widest text-muted">
            {t.divider}
          </span>
        </div>
      </div>

      {/* ================= FORM EMAIL & PASSWORD ================= */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />

        {/* Nama (Hanya Muncul Saat Daftar) */}
        {!isLogin && (
          <div className="group">
            <label
              htmlFor="login-nama"
              className="mb-1.5 block text-sm font-bold text-ink"
            >
              {t.labelNama}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink">
                <Icon name="user" className="size-4" />
              </span>
              <input
                id="login-nama"
                name="nama"
                type="text"
                required
                maxLength={40}
                autoComplete="nickname"
                placeholder={t.placeholderNama}
                style={{ paddingLeft: "2.75rem" }}
                className="kolom font-semibold transition-shadow placeholder:text-muted/70 group-focus-within:shadow-[0_3px_0_var(--sh)]"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="group">
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-bold text-ink"
          >
            {t.labelEmail}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink">
              <Icon name="mail" className="size-4" />
            </span>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder={t.placeholderEmail}
              style={{ paddingLeft: "2.75rem" }}
              className="kolom font-semibold transition-shadow placeholder:text-muted/70 group-focus-within:shadow-[0_3px_0_var(--sh)]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="group">
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-bold text-ink"
          >
            {t.labelPassword}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink">
              <Icon name="lock" className="size-4" />
            </span>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={t.placeholderPassword}
              style={{ paddingLeft: "2.75rem" }}
              className="kolom font-semibold transition-shadow placeholder:text-muted/70 group-focus-within:shadow-[0_3px_0_var(--sh)]"
            />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {state?.error && (
          <div className="flex items-start gap-2 rounded-lg border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-3 py-2">
            <Icon
              name="alert"
              className="mt-0.5 size-4 shrink-0 text-[color:var(--bahaya)]"
            />
            <p className="text-xs font-bold leading-snug text-[color:var(--bahaya)]">
              {state.error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pending}
          className="relative w-full group mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
          <div className="relative flex items-center justify-center gap-2 w-full bg-lime text-[#111] border-2 border-[#111] rounded-xl py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
            {pending ? (
              <>
                <svg
                  className="animate-spin size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t.loading}
              </>
            ) : (
              <>
                {isLogin ? t.btnLogin : t.btnRegister}
                <Icon name="arrow-right" className="size-4" strokeWidth={3} />
              </>
            )}
          </div>
        </button>
      </form>

      {/* Privacy Text */}
      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">
        {t.privacy}
      </p>
    </div>
  );
}
