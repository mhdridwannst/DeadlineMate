"use client";

import { useEffect, useState } from "react";
import {
  simpanSubscription,
  hapusSubscription,
  cekSubscription,
} from "@/server/push-actions";
import { Icon } from "@/components/ui/Icon";
import { sfxClick, sfxAiSuccess } from "@/lib/sfx";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotifToggle() {
  const [status, setStatus] = useState<
    "loading" | "unsupported" | "denied" | "inactive" | "active" | "working"
  >("loading");
  const [info, setInfo] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState(0);

  useEffect(() => {
    async function check() {
      if (typeof window === "undefined") return;

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        setStatus("active");
        const cek = await cekSubscription();
        setJumlah(cek.total);
      } else {
        setStatus("inactive");
      }
    }
    check();
  }, []);

  async function aktifkan() {
    sfxClick();
    setStatus("working");
    setInfo(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setInfo("Izin notifikasi ditolak. Aktifkan manual di setting browser.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      const subJSON = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const result = await simpanSubscription({
        endpoint: subJSON.endpoint,
        keys: subJSON.keys,
        userAgent: navigator.userAgent,
      });

      if (result.ok) {
        setStatus("active");
        sfxAiSuccess();
        setInfo("Notifikasi aktif! Lo bakal dapet reminder deadline.");
        const cek = await cekSubscription();
        setJumlah(cek.total);
      } else {
        setStatus("inactive");
        setInfo(result.error ?? "Gagal aktifkan notifikasi.");
      }
    } catch (e) {
      console.error(e);
      setStatus("inactive");
      setInfo("Gagal subscribe. Cek console untuk detail.");
    }
  }

  async function nonaktifkan() {
    sfxClick();
    setStatus("working");
    setInfo(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await hapusSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("inactive");
      setJumlah(0);
      setInfo("Notifikasi dimatikan.");
    } catch (e) {
      console.error(e);
      setStatus("active");
      setInfo("Gagal mematikan notifikasi.");
    }
  }

  async function kirimTest() {
    sfxClick();
    setInfo("Mengirim test notifikasi...");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        sfxAiSuccess();
        setInfo(
          `Test terkirim! Sukses: ${data.sukses}, Gagal: ${data.gagal}. Cek notifikasi OS lo.`,
        );
      } else {
        setInfo(data.error ?? "Gagal kirim test.");
      }
    } catch {
      setInfo("Gagal kirim test.");
    }
  }

  // ==================== RENDER ====================
  if (status === "loading") {
    return (
      <div className="rounded-xl border-2 border-[color:var(--line)] bg-card p-4 text-center text-xs text-muted">
        Memuat status notifikasi...
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
        <p className="text-xs font-bold text-ink">Notifikasi tidak didukung</p>
        <p className="mt-1 text-[11px] text-muted">
          Browser ini gak support push notification. Coba pakai
          Chrome/Edge/Firefox terbaru.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="rounded-xl border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] p-4">
        <p className="text-xs font-bold text-[color:var(--bahaya)]">
          Izin notifikasi ditolak
        </p>
        <p className="mt-1 text-[11px] text-[color:var(--bahaya)]/80">
          Buka setting browser → Site settings → Notifications → izinkan untuk
          site ini.
        </p>
      </div>
    );
  }

  const isActive = status === "active";
  const isWorking = status === "working";

  return (
    <div className="rounded-xl border-2 border-[color:var(--line)] bg-card p-4 shadow-[0_3px_0_var(--sh)]">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg border-2 border-[#111] ${
            isActive ? "bg-lime" : "bg-[color:var(--surface-2)]"
          }`}
        >
          <Icon name="alert" className="size-5 text-[#111]" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-ink">
            {isActive ? "Notifikasi Aktif" : "Aktifkan Pengingat Deadline"}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold text-muted leading-relaxed">
            {isActive
              ? `Lo bakal dapet reminder H-1, 3 jam sebelum, & saat telat. ${jumlah} device terdaftar.`
              : "Dapet notif di HP/laptop meskipun browser ditutup. Biar streak gak putus."}
          </p>
        </div>
      </div>

      {info && (
        <div
          className={`mt-3 rounded-lg border-2 px-2.5 py-1.5 text-[11px] font-bold ${
            isActive
              ? "border-[color:var(--santai)] bg-[color:var(--santai-bg)] text-[color:var(--santai)]"
              : "border-[color:var(--biru)] bg-[color:var(--biru-soft)] text-biru"
          }`}
        >
          {info}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {isActive ? (
          <>
            <button
              type="button"
              onClick={kirimTest}
              disabled={isWorking}
              className="rounded-lg border-2 border-[#111] bg-lime px-3 py-1.5 text-[11px] font-black text-[#111] shadow-[0_2px_0_var(--sh)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              🔔 Kirim Test Notif
            </button>
            <button
              type="button"
              onClick={nonaktifkan}
              disabled={isWorking}
              className="rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[11px] font-bold text-muted transition-all hover:border-[color:var(--bahaya)] hover:text-[color:var(--bahaya)] disabled:opacity-50"
            >
              Matikan
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={aktifkan}
            disabled={isWorking}
            className="rounded-lg border-2 border-[#111] bg-lime px-4 py-1.5 text-[11px] font-black text-[#111] shadow-[0_2px_0_var(--sh)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {isWorking ? "Memproses..." : "Aktifkan Notifikasi"}
          </button>
        )}
      </div>
    </div>
  );
}
