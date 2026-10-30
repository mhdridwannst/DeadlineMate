import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Logic middleware pindah ke sini
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const protectedRoutes = ["/today", "/progress", "/kalender", "/profil"];
      const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );

      if (isProtected && !isLoggedIn) return false;
      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/today", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
