// Shared display math: real-time clock, prayer phase state machine, formatting.

import { useEffect, useState } from "react";
import type { AzanSettings, IqamahSettings, MurattalSchedule, PrayerTimesOut } from "./types";

export const PRAYER_ORDER = ["imsak", "subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"] as const;
export const AZAN_ORDER = ["subuh", "dzuhur", "ashar", "maghrib", "isya"] as const;
export const PRAYER_LABELS: Record<string, string> = {
  imsak: "Imsak",
  subuh: "Subuh",
  syuruq: "Syuruq",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

export const TIMEZONES = [
  "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "Asia/Kuala_Lumpur",
  "Asia/Bangkok", "Asia/Riyadh", "Asia/Makkah", "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka",
  "Europe/Istanbul", "Europe/London", "America/New_York", "UTC",
];

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const timeFmtCache = new Map<string, Intl.DateTimeFormat>();
function timeFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = timeFmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    timeFmtCache.set(tz, fmt);
  }
  return fmt;
}

export function tzTimeParts(now: Date, tz: string) {
  const hhmmss = timeFormatter(tz).format(now);
  const dateLine = new Intl.DateTimeFormat("id-ID", {
    timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);
  const [h, m, s] = hhmmss.split(":").map(Number);
  return { hhmmss, dateLine, secondsOfDay: (h % 24) * 3600 + m * 60 + s };
}

export function secondsOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 3600 + m * 60;
}

export function fmtCountdown(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtMinutes(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export interface DisplayPhase {
  phase: "normal" | "azan" | "iqamah";
  prayerKey: string | null; // prayer that owns the current azan/iqamah window
  azanRemaining: number;
  iqamahRemaining: number;
  nextKey: string;
  nextTime: string;
  countdown: number; // seconds until next prayer
}

export function computeDisplayPhase(
  pt: PrayerTimesOut,
  azan: AzanSettings,
  iqamah: IqamahSettings,
  secondsNow: number,
): DisplayPhase {
  const azanWindow = azan.enabled ? Math.max(0, azan.duration_minutes) * 60 : 0;
  const windows = AZAN_ORDER.map((key) => {
    const t = secondsOfDay(pt.times[key] ?? "");
    return {
      key,
      t: Number.isFinite(t) ? t : NaN,
      off: Math.max(1, iqamah.offsets?.[key] ?? 10) * 60,
    };
  }).filter((w) => Number.isFinite(w.t));

  for (const w of windows) {
    if (azanWindow > 0 && secondsNow >= w.t && secondsNow < w.t + azanWindow) {
      return {
        phase: "azan", prayerKey: w.key,
        azanRemaining: w.t + azanWindow - secondsNow,
        iqamahRemaining: Math.max(0, w.t + w.off - secondsNow),
        nextKey: w.key, nextTime: pt.times[w.key] ?? "", countdown: w.t - secondsNow,
      };
    }
    if (iqamah.enabled && secondsNow >= w.t + azanWindow && secondsNow < w.t + w.off) {
      return {
        phase: "iqamah", prayerKey: w.key,
        azanRemaining: 0, iqamahRemaining: w.t + w.off - secondsNow,
        nextKey: w.key, nextTime: pt.times[w.key] ?? "", countdown: w.t - secondsNow,
      };
    }
  }

  const upcoming = windows.find((w) => w.t > secondsNow);
  if (upcoming) {
    return {
      phase: "normal", prayerKey: null, azanRemaining: 0, iqamahRemaining: 0,
      nextKey: upcoming.key, nextTime: pt.times[upcoming.key] ?? "", countdown: upcoming.t - secondsNow,
    };
  }
  // after Isya → tomorrow's Subuh
  const subuh = windows.find((w) => w.key === "subuh");
  return {
    phase: "normal", prayerKey: null, azanRemaining: 0, iqamahRemaining: 0,
    nextKey: "subuh", nextTime: pt.times.subuh ?? "", countdown: (subuh ? subuh.t : 0) + 86400 - secondsNow,
  };
}

export function activeMurattal(murattal: MurattalSchedule[], secondsNow: number): MurattalSchedule | null {
  for (const m of murattal) {
    if (!m.enabled) continue;
    const start = secondsOfDay(m.start_time);
    if (Number.isFinite(start) && secondsNow >= start && secondsNow < start + m.duration_minutes * 60) {
      return m;
    }
  }
  return null;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full.slice(0, 6) || "000000", 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
