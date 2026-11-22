import Image from "next/image";

// Rasio tinggi/lebar mate.png (512x546)
const RASIO = 546 / 512;

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Maskot Mate. Di tema terang memakai mate.png; di tema gelap memakai versi stiker
 * (outline putih) supaya garis tepi hitamnya tidak hilang di latar gelap.
 * Pergantian dilakukan lewat CSS (.mate-terang / .mate-gelap di globals.css).
 * Beri alt="" kalau di sebelahnya sudah ada teks "DeadlineMate".
 */
export function MateLogo({
  size = 40,
  className = "",
  priority = false,
  alt = "",
}: Props) {
  const tinggi = Math.round(size * RASIO);
  return (
    <>
      <Image
        src="/mate.png"
        alt={alt}
        width={size}
        height={tinggi}
        priority={priority}
        unoptimized
        className={`mate-terang object-contain ${className}`}
      />
      <Image
        src="/mate-stiker.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={tinggi}
        unoptimized
        className={`mate-gelap object-contain ${className}`}
      />
    </>
  );
}
