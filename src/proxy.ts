// src/proxy.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-|.*\\.png|.*\\.svg|login|forgot-password|reset-password).*)",
  ],
};
