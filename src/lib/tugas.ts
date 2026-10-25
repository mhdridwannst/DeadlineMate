import { format, formatDistanceToNowStrict } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Task } from "@/generated/prisma/client";

export type TaskDenganLangkah = Task & { subtasks: Task[] };

export type ItemTugas = {
  id: string;
  judul: string;
  selesai: boolean;
  tenggat: string;
  tenggatPendek: string;
  sisa: string;
  mendesak: boolean;
  telat: boolean;
  estimasi: string;
  langkah: ItemTugas[];
  selesaiLangkah: number;
  totalLangkah: number;
};

function ubahSatu(
  t: Task,
  sekarang: Date,
  langkah: ItemTugas[] = [],
): ItemTugas {
  const due = t.dueAt;
  const jarak = due ? formatDistanceToNowStrict(due, { locale: localeId }) : "";
  return {
    id: t.id,
    judul: t.title,
    selesai: t.status === "DONE",
    tenggat: due
      ? format(due, "EEEE, d MMM, HH.mm", { locale: localeId })
      : "Tanpa tenggat",
    tenggatPendek: due
      ? format(due, "EEE d MMM, HH.mm", { locale: localeId })
      : "Tanpa tenggat",
    sisa: due ? (due < sekarang ? `lewat ${jarak}` : `${jarak} lagi`) : "",
    mendesak:
      !!due && due.getTime() - sekarang.getTime() < 3 * 24 * 60 * 60 * 1000,
    telat: !!due && due < sekarang,
    estimasi: t.estimateMin ? `${t.estimateMin} menit` : "",
    langkah,
    selesaiLangkah: langkah.filter((l) => l.selesai).length,
    totalLangkah: langkah.length,
  };
}

export function siapkanTugas(tasks: TaskDenganLangkah[]): ItemTugas[] {
  const sekarang = new Date();
  return tasks.map((t) =>
    ubahSatu(
      t,
      sekarang,
      t.subtasks.map((s) => ubahSatu(s, sekarang)),
    ),
  );
}

export function cariBerikutnya(items: ItemTugas[]) {
  const t = items.find((x) => !x.selesai);
  if (!t) return null;
  const langkah = t.langkah.find((l) => !l.selesai);
  const target = langkah ?? t;
  return {
    judul: target.judul,
    induk: t.judul,
    tenggat: target.tenggat,
    bagian: !!langkah,
  };
}
