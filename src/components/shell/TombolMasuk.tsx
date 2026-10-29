"use client";

import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";

export default function TombolMasuk() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="tombol mt-2 min-h-12 w-full text-base"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Masuk...
        </>
      ) : (
        <>
          Masuk
          <Icon name="arrow-right" className="size-4" strokeWidth={3} />
        </>
      )}
    </button>
  );
}
