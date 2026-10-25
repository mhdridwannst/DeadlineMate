"use client";

import { useTema, type Tema } from "./tema";

const OPSI: { n: Tema; l: string }[] = [
  { n: "terang", l: "Terang" },
  { n: "gelap", l: "Gelap" },
  { n: "sistem", l: "Sistem" },
];

export default function ThemeSwitch() {
  const [tema, setTema] = useTema();
  return (
    <div role="group" aria-label="Tema" className="grid grid-cols-3 gap-2">
      {OPSI.map((o) => (
        <button
          key={o.n}
          type="button"
          aria-pressed={tema === o.n}
          onClick={() => setTema(o.n)}
          className={`tombol ${tema === o.n ? "" : "tombol-putih"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
