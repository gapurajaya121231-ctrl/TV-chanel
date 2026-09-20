import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { computeDisplayPhase, tzTimeParts, useClock } from "@/lib/display";
import type { DisplayData } from "@/lib/types";
import { LayoutEngine } from "@/components/display/LayoutEngine";
import { TvFrame } from "@/components/display/TvFrame";

interface WakeLockLike {
  release: () => Promise<void>;
}

export default function Display() {
  const { data, isError } = useQuery({
    queryKey: ["display"],
    queryFn: () => apiGet<DisplayData>("/display"),
    refetchInterval: 60_000,
    retry: 1,
  });
  const now = useClock();
  const [hintVisible, setHintVisible] = useState(true);

  // Wake Lock — layar TV tetap menyala, tidak masuk screen saver; diulang saat tab kembali terlihat.
  useEffect(() => {
    let sentinel: WakeLockLike | null = null;
    const request = async () => {
      try {
        const wl = (navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> };
        }).wakeLock;
        sentinel = wl ? await wl.request("screen") : null;
      } catch {
        sentinel = null; // unsupported/denied — the kiosk browser handles power settings
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);

  const toggleFullscreen = () => {
    setHintVisible(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  const tz = data?.mosque.timezone || "Asia/Jakarta";
  const parts = tzTimeParts(now, tz);

  // Backend unreachable: still a live clock — never a blank or error screen.
  if (!data) {
    return (
      <TvFrame fit="viewport" className="bg-[#061325]" onClick={toggleFullscreen}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-10 text-white" data-testid="display-fallback">
          <div className="font-mono text-[11rem] font-bold tabular-nums" data-testid="display-fallback-clock">
            {parts.hhmmss}
          </div>
          <div className="text-4xl" data-testid="display-fallback-date">{parts.dateLine}</div>
          <div className="text-2xl text-white/60" data-testid="display-fallback-status">
            {isError ? "Koneksi ke server terputus — mencoba ulang…" : "Menyambungkan ke server…"}
          </div>
        </div>
      </TvFrame>
    );
  }

  const phase = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, parts.secondsOfDay);

  return (
    <TvFrame fit="viewport" onClick={toggleFullscreen}>
      <LayoutEngine data={data} now={now} phase={phase} />
      {hintVisible && (
        <div
          className="pointer-events-none absolute bottom-6 right-8 z-[60] rounded-full bg-black/60 px-5 py-2 text-lg text-white/80"
          data-testid="display-fullscreen-hint"
        >
          Klik di mana saja untuk layar penuh
        </div>
      )}
    </TvFrame>
  );
}
