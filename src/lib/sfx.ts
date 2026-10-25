"use client";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem("dm_sfx") === "off") return null;
  } catch {}

  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

export function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem("dm_sfx") !== "off";
  } catch {
    return true;
  }
}

export function toggleSfx(): boolean {
  const next = !isSfxEnabled();
  try {
    localStorage.setItem("dm_sfx", next ? "on" : "off");
  } catch {}
  if (next) sfxClick();
  return next;
}

/** Suara klik tombol taktil pendek */
export function sfxClick() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

/** Suara centang selesai (2 nada naik jika selesai, 1 nada turun jika batal) */
export function sfxCheck(selesai: boolean) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  if (selesai) {
    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
    notes.forEach((freq, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const t = now + idx * 0.055;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  } else {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

/** Suara hapus tugas */
export function sfxDelete() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Suara sukses AI */
export function sfxAiSuccess() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const chord = [587.33, 739.99, 880, 1174.66]; // D major 7 arpeggio
  chord.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = now + i * 0.045;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  });
}
