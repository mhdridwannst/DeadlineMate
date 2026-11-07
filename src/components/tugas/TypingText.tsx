"use client";
import { useEffect, useState } from "react";

export function TypingText({ text }: { text: string }) {
  const [tampil, setTampil] = useState("");

  useEffect(() => {
    let indeks = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const mulai = setTimeout(() => {
      setTampil("");
      timer = setInterval(() => {
        indeks += 1;
        setTampil(text.slice(0, indeks));
        if (indeks >= text.length && timer) clearInterval(timer);
      }, 30);
    }, 0);

    return () => {
      clearTimeout(mulai);
      if (timer) clearInterval(timer);
    };
  }, [text]);

  return (
    <span>
      {tampil}
      {/* Kursor ketik yang berkedip */}
      <span className="inline-block w-1.5 h-4 ml-1 bg-ink animate-pulse align-middle" />
    </span>
  );
}
