"use client";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  kecil?: boolean;
};

export function BubbleCheck({
  checked,
  onChange,
  label,
  kecil = false,
}: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
    >
      <svg
        viewBox="0 0 32 32"
        className={`text-pensil ${kecil ? "size-6" : "size-8"}`}
        aria-hidden="true"
      >
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 11 L24 8 M7 15 L25 12 M7 19 L25 16 M8 23 L24 20"
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-[380ms] ease-out motion-reduce:transition-none"
          style={{ strokeDasharray: 1, strokeDashoffset: checked ? 0 : 1 }}
        />
      </svg>
    </button>
  );
}
