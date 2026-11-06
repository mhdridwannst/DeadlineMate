// src/proxy.ts (atau src/middleware.ts)
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Jangan jalanin middleware di:
     * - API routes
     * - Static files (Next.js)
     * - File publik (sw.js, manifest.json, icon, gambar)
     * - Halaman auth (biar cepet)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-|.*\\.png|.*\\.svg|login|forgot-password|reset-password).*)",
  ],
};
