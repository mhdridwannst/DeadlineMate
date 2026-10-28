import { TypingText } from "./TypingText";

export function MateChat({ text, title }: { text: string; title: string }) {
  return (
    <div className="relative flex flex-col gap-3 ">
      {/* Maskot Mate: Kotak dengan animasi melayang */}
      <div className="relative shrink-0 z-10">
        <div
          className="w-12 h-12 bg-lime border-2 border-ink shadow-[0_3px_0_var(--sh)] rounded-xl flex items-center justify-center text-2xl"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
        🤖
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative flex-1 bg-card border-2 border-ink shadow-[0_4px_0_var(--sh)] p-4 rounded-2xl rounded-tl-sm">
        {/* Ekor Gelembung Bicara (Pakai CSS Border Segitiga) */}
        <div className="absolute -top-[10px] left-3 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-ink"></div>
        <div className="absolute -top-[7px] left-[14px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-card"></div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted bg-[color:var(--surface-2)] px-2 py-0.5 rounded-md border border-[color:var(--line)]/30">
            {title}
          </span>
        </div>

        {/* Teks ngetik */}
        <div className="text-sm font-semibold leading-relaxed text-ink min-h-[3rem]">
          “<TypingText text={text} />”
        </div>
      </div>
    </div>
  );
}
