"use client";

import { useEffect, useState } from "react";

export default function PwaSplash() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kasih delay 1.5 detik biar animasi kelihatan
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[color:var(--bg)] overflow-hidden">
      
      {/* Pattern Dot biar gak sepi */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(var(--ink) 2px, transparent 2px)', backgroundSize: '24px 24px' }} 
      />

      <div className="relative flex flex-col items-center z-10">
        {/* Logo Animasi Bouncing */}
        <div className="relative">
          <span className="grid size-28 place-items-center rounded-3xl border-4 border-[#111] bg-lime text-6xl font-black text-[#111] shadow-[0_8px_0_var(--sh)] animate-bounce">
            D
          </span>
          <span className="absolute -bottom-3 -right-3 rounded-lg border-2 border-[#111] bg-white px-3 py-1 text-sm font-black text-[#111] shadow-[0_3px_0_var(--sh)] rotate-6">
            BETA
          </span>
        </div>

        {/* Teks Brand */}
        <h1 className="mt-12 text-4xl font-black tracking-tight text-ink">
          <span className="judul-stabilo">DeadlineMate</span>
        </h1>
        
        {/* Loading Bar Brutalism */}
        <div className="mt-8 w-56 h-5 rounded-full border-2 border-[#111] bg-card overflow-hidden shadow-[0_3px_0_var(--sh)] relative">
          <div className="h-full bg-lime animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
        
        <p className="mt-4 text-xs font-bold tracking-widest text-muted uppercase animate-pulse">
          Memuat Aplikasi...
        </p>
      </div>
    </div>
  );
}
