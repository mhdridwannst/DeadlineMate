import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/shell/ServiceWorkerRegister";
import PwaSplash from "@/components/shell/PwaSplash";
import { PwaInstallProvider } from "@/components/shell/PwaInstall";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeadlineMate | Asisten tugas untuk mahasiswa",
  description:
    "Pecah tenggat besar menjadi langkah kecil, atur tugas, dan pantau progres belajarmu bersama Mate.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeadlineMate",
  },
  openGraph: {
    title: "DeadlineMate | Asisten tugas untuk mahasiswa",
    description:
      "Pecah tenggat besar menjadi langkah kecil, atur tugas, dan pantau progres belajarmu bersama Mate.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DeadlineMate, asisten tugas untuk mahasiswa",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
};

const SKRIP_TEMA = `(function(){try{var p=localStorage.getItem("tema")||"sistem";var d=p==="gelap"||(p==="sistem"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={outfit.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body>
        <PwaInstallProvider>
          <PwaSplash />
          <ServiceWorkerRegister />
          {children}
        </PwaInstallProvider>
      </body>
    </html>
  );
}
