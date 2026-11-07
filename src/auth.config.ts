// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPages = [
        "/login",
        "/forgot-password",
        "/reset-password",
      ].includes(nextUrl.pathname);

      // Kalau lagi di halaman auth dan udah login, tendang ke /today
      if (isOnAuthPages) {
        if (isLoggedIn) return Response.redirect(new URL("/today", nextUrl));
        return true;
      }

      // Kalau lagi di halaman protected dan belum login, block
      const isProtected = ["/today", "/progress", "/kalender", "/profil"].some(
        (route) => nextUrl.pathname.startsWith(route),
      );

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
