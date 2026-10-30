"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  loginDenganCredentials,
  loginDenganGoogle,
  type HasilAuth,
} from "@/server/auth-actions";
import { Icon } from "@/components/ui/Icon";

type Lang = "id" | "en";
type Mode = "login" | "register";

// Samakan dengan validasi di server (server/auth-actions.ts).
const MIN_PASSWORD = 6;

const TEKS = {
  id: {
    modeLabel: "Pilih Masuk atau Daftar",
    tabLogin: "Masuk",
    tabRegister: "Daftar",
    titleLogin: "Masuk ke akunmu",
    titleRegister: "Buat akun baru",
    descLogin: "Masukkan email dan password untuk melanjutkan progresmu.",
    descRegister:
      "Cukup nama, email, dan password. Progres dan XP-mu tersimpan aman.",
    labelNama: "Nama panggilan",
    placeholderNama: "Mis. Go Yoon Jung",
    labelEmail: "Email",
    placeholderEmail: "nama@email.com",
    labelPassword: "Password",
    placeholderPasswordLogin: "Masukkan password",
    placeholderPasswordRegister: "Buat password",
    hintPassword: (n: number) => `Minimal ${n} karakter.`,
    showPassword: "Tampilkan password",
    hidePassword: "Sembunyikan password",
    btnLogin: "Masuk",
    btnRegister: "Buat Akun",
    loading: "Memproses...",
    privacy: "Emailmu dipakai hanya untuk mengenali akunmu.",
    consentPre: "Dengan mendaftar, kamu menyetujui ",
    consentMid: " dan ",
    consentPost: ".",
    terms: "Ketentuan Layanan",
    privacyLink: "Kebijakan Privasi",
    googleBtn: "Lanjutkan dengan Google",
    divider: "atau pakai email",
  },
  en: {
    modeLabel: "Choose Sign In or Register",
    tabLogin: "Sign In",
    tabRegister: "Register",
    titleLogin: "Sign in to your account",
    titleRegister: "Create new account",
    descLogin: "Enter your email and password to continue your progress.",
    descRegister:
      "Just name, email, and password. Your progress and XP are safely saved.",
    labelNama: "Nickname",
    placeholderNama: "e.g. Go Yoon Jung",
    labelEmail: "Email",
    placeholderEmail: "name@email.com",
    labelPassword: "Password",
    placeholderPasswordLogin: "Enter your password",
    placeholderPasswordRegister: "Create a password",
    hintPassword: (n: number) => `At least ${n} characters.`,
    showPassword: "Show password",
    hidePassword: "Hide password",
    btnLogin: "Sign In",
    btnRegister: "Create Account",
    loading: "Processing...",
    privacy: "Your email is only used to identify your account.",
    consentPre: "By registering, you agree to the ",
    consentMid: " and ",
    consentPost: ".",
    terms: "Terms of Service",
    privacyLink: "Privacy Policy",
    googleBtn: "Continue with Google",
    divider: "or use email",
  },
} as const;

const FIELD_CLASS =
  "kolom font-semibold transition-shadow placeholder:text-muted group-focus-within:shadow-[0_3px_0_var(--sh)]";

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// Tombol Google dipisah supaya bisa memakai useFormStatus (harus berada
// di dalam <form>). Hasilnya: ada status loading dan tidak bisa diklik ganda.
function GoogleButton({
  label,
  loadingLabel,
  disabled,
}: {
  label: string;
  loadingLabel: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const off = pending || disabled;

  return (
    <button
      type="submit"
      disabled={off}
      className="group relative block w-full outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-1 rounded-xl bg-[color:var(--sh)] transition-transform group-hover:translate-y-1.5 group-active:translate-y-0"
      />
      <span className="relative flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-card py-3 text-sm font-black text-ink transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0.5 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
        {pending ? (
          <>
            <Spinner />
            {loadingLabel}
          </>
        ) : (
          <>
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
            {label}
          </>
        )}
      </span>
    </button>
  );
}

export default function LoginForm({
  lang,
  defaultMode = "login",
}: {
  lang: Lang;
  defaultMode?: Mode;
}) {
  const t = TEKS[lang];

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Error dari percobaan sebelumnya disembunyikan saat user pindah tab,
  // dan muncul lagi hanya setelah submit berikutnya.
  const [showError, setShowError] = useState(true);

  const [state, formAction, pending] = useActionState<HasilAuth, FormData>(
    async (prev, formData) => {
      setShowError(true);
      return loginDenganCredentials(prev, formData);
    },
    null,
  );

  const isLogin = mode === "login";

  function switchMode(next: Mode) {
    setMode(next);
    setShowError(false);
    setShowPassword(false);
  }

  const modes: { id: Mode; label: string }[] = [
    { id: "login", label: t.tabLogin },
    { id: "register", label: t.tabRegister },
  ];

  return (
    <div className="kartu relative p-6 sm:p-8">
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

      {/* ================= PILIH MODE (Masuk / Daftar) ================= */}
      <div
        role="group"
        aria-label={t.modeLabel}
        className="mb-6 flex rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-1"
      >
        {modes.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => switchMode(m.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-black transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active
                  ? "border-2 border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* ================= HEADER TEKS ================= */}
      <h2 className="text-xl font-extrabold text-ink">
        {isLogin ? t.titleLogin : t.titleRegister}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {isLogin ? t.descLogin : t.descRegister}
      </p>

      {/* ================= GOOGLE OAUTH ================= */}
      <form action={loginDenganGoogle} className="mt-5">
        <GoogleButton
          label={t.googleBtn}
          loadingLabel={t.loading}
          disabled={pending}
        />
      </form>

      {/* ================= DIVIDER ================= */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-dashed border-[color:var(--line)]/30" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[11px] font-black uppercase tracking-widest text-muted">
            {t.divider}
          </span>
        </div>
      </div>

      {/* ================= FORM EMAIL & PASSWORD ================= */}
      <form action={formAction} className="space-y-4" aria-busy={pending}>
        <input type="hidden" name="mode" value={mode} />

        {/* Nama (hanya saat daftar) */}
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
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                className={FIELD_CLASS}
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
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t.placeholderEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: "2.75rem" }}
              className={FIELD_CLASS}
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
              type={showPassword ? "text" : "password"}
              required
              // Aturan panjang hanya berlaku saat daftar. Saat masuk, jangan
              // memblokir user lama dengan validasi yang bukan urusan login.
              minLength={isLogin ? undefined : MIN_PASSWORD}
              autoComplete={isLogin ? "current-password" : "new-password"}
              aria-describedby={isLogin ? undefined : "login-password-hint"}
              placeholder={
                isLogin
                  ? t.placeholderPasswordLogin
                  : t.placeholderPasswordRegister
              }
              style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
              className={FIELD_CLASS}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <path d="M1 1l22 22" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {!isLogin && (
            <p id="login-password-hint" className="mt-1.5 text-xs text-muted">
              {t.hintPassword(MIN_PASSWORD)}
            </p>
          )}
        </div>

        {/* ERROR */}
        {showError && state?.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-3 py-2"
          >
            <Icon
              name="alert"
              className="mt-0.5 size-4 shrink-0 text-[color:var(--bahaya)]"
            />
            <p className="text-sm font-bold leading-snug text-[color:var(--bahaya)]">
              {state.error}
            </p>
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={pending}
          className="group relative mt-2 block w-full outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-y-1.5 rounded-xl bg-[color:var(--sh)] transition-transform group-hover:translate-y-2 group-active:translate-y-0"
          />
          <span className="relative flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#111] bg-lime py-3.5 text-sm font-black text-[#111] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ink">
            {pending ? (
              <>
                <Spinner />
                {t.loading}
              </>
            ) : (
              <>
                {isLogin ? t.btnLogin : t.btnRegister}
                <Icon name="arrow-right" className="size-4" strokeWidth={3} />
              </>
            )}
          </span>
        </button>
      </form>

      {/* ================= TEKS KEPERCAYAAN ================= */}
      <div className="mt-4 space-y-1.5 text-center text-xs leading-relaxed text-muted">
        {!isLogin && (
          <p>
            {t.consentPre}
            <Link
              href="/terms"
              className="font-semibold text-ink underline underline-offset-2"
            >
              {t.terms}
            </Link>
            {t.consentMid}
            <Link
              href="/privacy"
              className="font-semibold text-ink underline underline-offset-2"
            >
              {t.privacyLink}
            </Link>
            {t.consentPost}
          </p>
        )}
        <p>{t.privacy}</p>
      </div>
    </div>
  );
}
