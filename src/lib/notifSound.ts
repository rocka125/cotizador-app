"use client";

// Synthesized notification sounds -- ported and extended from the PHP app's
// Web Audio approach (assets/js/notif-sound.js): no audio files to host, so
// there's nothing that can 404 on a fresh deploy, and each notification
// "tipo" (see logging.ts / migration 0019) gets its own short, distinct
// tone shape instead of one generic ping for everything.

const STORAGE_KEY = "notif_sound_enabled";
let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtxCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxCtor) return null;
  if (!ctx) ctx = new AudioCtxCtor();
  // Browsers suspend a freshly-created AudioContext until a user gesture;
  // resume() is a no-op once one has already happened.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

interface Note {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  type?: OscillatorType;
}

function playNotes(notes: Note[]) {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;

  const now = c.currentTime;
  for (const note of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.setValueAtTime(note.freq, now + note.start);

    const peak = note.gain ?? 0.18;
    const t0 = now + note.start;
    const t1 = t0 + note.dur;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, note.dur / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

export type NotifTipo =
  | "creacion"
  | "edicion"
  | "eliminacion"
  | "estado"
  | "email_abierto"
  | "nota_ajena"
  | "urgente"
  | "vigencia";

const SOUNDS: Record<NotifTipo, Note[]> = {
  // Dos notas ascendentes, cálido -- algo nuevo se creó.
  creacion: [
    { freq: 587.33, start: 0, dur: 0.11, gain: 0.16 },
    { freq: 880.0, start: 0.1, dur: 0.16, gain: 0.18 },
  ],
  // Un solo tono medio triangular, neutro.
  edicion: [{ freq: 660.0, start: 0, dur: 0.14, type: "triangle", gain: 0.15 }],
  // Dos notas descendentes en menor, seco.
  eliminacion: [
    { freq: 392.0, start: 0, dur: 0.13, type: "sawtooth", gain: 0.12 },
    { freq: 293.66, start: 0.11, dur: 0.22, type: "sawtooth", gain: 0.14 },
  ],
  // Arpegio ascendente brillante -- cambio de estado (aprobada/rechazada/pendiente).
  estado: [
    { freq: 523.25, start: 0, dur: 0.1, gain: 0.15 },
    { freq: 659.25, start: 0.08, dur: 0.1, gain: 0.16 },
    { freq: 783.99, start: 0.16, dur: 0.2, gain: 0.19 },
  ],
  // "Whoosh" ágil de tres notas agudas -- el cliente reaccionó al correo.
  email_abierto: [
    { freq: 740.0, start: 0, dur: 0.09, type: "triangle", gain: 0.15 },
    { freq: 987.77, start: 0.07, dur: 0.1, type: "triangle", gain: 0.17 },
    { freq: 1318.5, start: 0.15, dur: 0.14, gain: 0.14 },
  ],
  // Ping doble suave -- alguien más dejó una nota.
  nota_ajena: [
    { freq: 587.33, start: 0, dur: 0.09, gain: 0.14 },
    { freq: 587.33, start: 0.14, dur: 0.09, gain: 0.14 },
  ],
  // Tono cuadrado grave repetido tres veces -- llama la atención sin ser agresivo.
  urgente: [
    { freq: 349.23, start: 0, dur: 0.1, type: "square", gain: 0.1 },
    { freq: 349.23, start: 0.16, dur: 0.1, type: "square", gain: 0.1 },
    { freq: 349.23, start: 0.32, dur: 0.14, type: "square", gain: 0.12 },
  ],
  // Dos notas largas descendentes -- recordatorio de plazo por vencer.
  vigencia: [
    { freq: 698.46, start: 0, dur: 0.22, gain: 0.13 },
    { freq: 523.25, start: 0.18, dur: 0.26, gain: 0.15 },
  ],
};

const DEFAULT_SOUND: Note[] = [{ freq: 660, start: 0, dur: 0.18, gain: 0.15 }];

export function playNotifSound(tipo: string | null | undefined) {
  playNotes((tipo && SOUNDS[tipo as NotifTipo]) || DEFAULT_SOUND);
}
