// Short, subtle, professional CRM notification chime — synthesized via the
// Web Audio API rather than shipping a binary asset (none exist in this repo
// and none are needed). Two soft sine tones, ~150ms total, gain-enveloped so
// there's no click at the edges.
//
// Autoplay safety: browsers suspend a freshly-created AudioContext until the
// user interacts with the page. `armAudioUnlock()` (called once, at the app
// root) resumes it on the first pointerdown/keydown. `playNotificationChime`
// itself never throws and never retries — a blocked/unavailable context is a
// silent no-op, exactly as required ("notification functionality must never
// depend on sound").

let audioContext: AudioContext | null = null;
let unlockArmed = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    try {
      audioContext = new Ctor();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/** Call once at the app root — resumes the (possibly browser-suspended) AudioContext on first user interaction. */
export function armAudioUnlock() {
  if (unlockArmed || typeof window === "undefined") return;
  unlockArmed = true;

  function resume() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {
        // Swallowed — the next chime attempt just no-ops if still blocked.
      });
    }
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  }

  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}

function playTone(ctx: AudioContext, startTime: number, frequency: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Quick fade-in/out envelope — avoids the audible "click" a hard on/off
  // edge would produce, and keeps the volume genuinely subtle.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Never throws, never blocks, never retries — a no-op if audio is unavailable/blocked. */
export function playNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    playTone(ctx, now, 880, 0.09); // A5
    playTone(ctx, now + 0.09, 1174.66, 0.09); // D6 — a small upward interval reads as "positive/arrived"
  } catch {
    // Never throws outward — notification functionality must never depend on sound.
  }
}
