"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  canInstall: boolean;
  install: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const tangkapPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const appTerpasang = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", tangkapPrompt);
    window.addEventListener("appinstalled", appTerpasang);

    return () => {
      window.removeEventListener("beforeinstallprompt", tangkapPrompt);
      window.removeEventListener("appinstalled", appTerpasang);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <PwaInstallContext.Provider
      value={{ canInstall: installPrompt !== null, install }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error(
      "PwaInstallButton harus berada di dalam PwaInstallProvider.",
    );
  }
  if (!context.canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => void context.install()}
      className={`tombol tombol-putih w-full ${className}`.trim()}
    >
      <Icon name="download" className="size-4" />
      Pasang aplikasi
    </button>
  );
}
