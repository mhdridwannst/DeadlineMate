"use client";

import { useTema, type Tema } from "./tema";
import { DICT, type Lang } from "@/lib/i18n";

const OPSI: { n: Tema; key: "themeLight" | "themeDark" | "themeSystem" }[] = [
  { n: "terang", key: "themeLight" },
  { n: "gelap", key: "themeDark" },
  { n: "sistem", key: "themeSystem" },
];

export default function ThemeSwitch({ lang = "id" }: { lang?: Lang }) {
  const [tema, setTema] = useTema();
  const t = DICT[lang];
  return (
    <div
      role="group"
      aria-label={t.themeTitle}
      className="grid grid-cols-3 gap-2"
    >
      {OPSI.map((o) => (
        <button
          key={o.n}
          type="button"
          aria-pressed={tema === o.n}
          onClick={() => setTema(o.n)}
          className={`tombol ${tema === o.n ? "" : "tombol-putih"}`}
        >
          {t[o.key]}
        </button>
      ))}
    </div>
  );
}
