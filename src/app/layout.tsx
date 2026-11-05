import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/shell/ServiceWorkerRegister";
import ThemeColorSync from "@/components/shell/ThemeColorSync";
import PwaSplash from "@/components/shell/PwaSplash";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deadline Mate - App Scheduler",
  description:
    "Teman yang ngejar deadline bareng lu. Pecah tugas, jaga streak, selesaikan tepat waktu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeadlineMate",
  },
  openGraph: {
    title: "DeadlineMate - Teman yang ngejar deadline bareng kamu",
    description:
      "Mate, asisten AI-mu, memecah tugas besar jadi langkah kecil dengan tenggatnya masing-masing.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
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
        <PwaSplash />
        <ThemeColorSync />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
