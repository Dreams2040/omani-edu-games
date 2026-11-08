"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Calls `onChange` whenever the database announces a change in this session
 * (Realtime Broadcast from triggers), and every `pollMs` as a fallback for
 * flaky classroom Wi-Fi.
 */
export function useSessionUpdates(sessionId: string | null, onChange: () => void, pollMs = 4000) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`game:${sessionId}`, { config: { private: false } })
      .on("broadcast", { event: "*" }, () => latest.current())
      .subscribe();
    const timer = setInterval(() => latest.current(), pollMs);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [sessionId, pollMs]);
}

/** Seconds left until `deadline` (ISO string), updated every quarter second. */
export function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));
}

// ─── Sound ─────────────────────────────────────────────────
// Soft synthesized tones, no audio files. Teachers can mute; the choice is remembered.

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

export type SoundName = "correct" | "wrong" | "next" | "finish" | "tick";

const SOUNDS: Record<SoundName, () => void> = {
  correct: () => {
    tone(660, 0, 0.18);
    tone(880, 0.12, 0.3);
  },
  wrong: () => tone(220, 0, 0.35, "triangle", 0.1),
  next: () => tone(520, 0, 0.15, "sine", 0.08),
  tick: () => tone(900, 0, 0.06, "square", 0.03),
  finish: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.14, 0.35)),
};

export function useSound() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read a saved preference once on mount
      setEnabled(localStorage.getItem("game-sound") !== "off");
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      try {
        localStorage.setItem("game-sound", on ? "off" : "on");
      } catch {}
      return !on;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        ctx ??= new AudioContext();
        if (ctx.state === "suspended") void ctx.resume();
        SOUNDS[name]();
      } catch {}
    },
    [enabled],
  );

  return { enabled, toggle, play };
}

// ─── Fullscreen ────────────────────────────────────────────

export function useFullscreen() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);
  return { on, toggle };
}
