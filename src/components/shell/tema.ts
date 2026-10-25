"use client";

import { useSyncExternalStore } from "react";

export type Tema = "terang" | "gelap" | "sistem";
const EVT = "tema-berubah";

function baca(): Tema {
  try {
    const s = localStorage.getItem("tema");
    return s === "terang" || s === "gelap" || s === "sistem" ? s : "sistem";
  } catch {
    return "sistem";
  }
}

function terapkan(t: Tema) {
  const gelap =
    t === "gelap" ||
    (t === "sistem" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = gelap ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const ikutSistem = () => {
    if (baca() === "sistem") terapkan("sistem");
  };
  addEventListener(EVT, cb);
  addEventListener("storage", cb);
  mq.addEventListener("change", ikutSistem);
  return () => {
    removeEventListener(EVT, cb);
    removeEventListener("storage", cb);
    mq.removeEventListener("change", ikutSistem);
  };
}

export function useTema() {
  const tema = useSyncExternalStore(subscribe, baca, () => "sistem" as Tema);
  function setTema(t: Tema) {
    try {
      localStorage.setItem("tema", t);
    } catch {}
    terapkan(t);
    dispatchEvent(new Event(EVT));
  }
  return [tema, setTema] as const;
}
