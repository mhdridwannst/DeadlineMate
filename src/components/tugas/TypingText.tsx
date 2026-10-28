"use client";
import { useEffect, useState } from "react";

export function TypingText({ text }: { text: string }) {
  const [tampil, setTampil] = useState("");

  useEffect(() => {
    setTampil("");
    let i = 0;
    // Kecepatan ngetik 30ms per huruf
    const timer = setInterval(() => {
      setTampil(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {tampil}
      {/* Kursor ketik yang berkedip */}
      <span className="inline-block w-1.5 h-4 ml-1 bg-ink animate-pulse align-middle" />
    </span>
  );
}
