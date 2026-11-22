// Hanya URL Vercel Blob milik user yang boleh disimpan atau dihapus sebagai lampiran.
const HOST_BLOB = [
  ".public.blob.vercel-storage.com",
  ".private.blob.vercel-storage.com",
];

export function urlLampiranMilikUser(raw: string, userId: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }

  if (u.protocol !== "https:") return false;
  if (!HOST_BLOB.some((suffix) => u.hostname.endsWith(suffix))) return false;

  // Upload menyimpan file di `${userId}/nama-file`, jadi segmen pertama path harus userId.
  let path: string;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    return false;
  }
  const pemilik = path.replace(/^\/+/, "").split("/")[0];
  return pemilik === userId;
}
