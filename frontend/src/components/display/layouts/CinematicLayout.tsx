import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  ContentRotator,
  DateLines,
  DigitalClock,
  NextPrayerCountdown,
  PrayerListVertical,
  RunningTextBar,
  SlideShow,
  type TvLayoutProps,
} from "../shared";

// CINEMATIC — foto sebagai latar utama, panel transparan, overlay ringan, elegan.
export function CinematicLayout({ data, cfg, now }: TvLayoutProps) {
  const glass: CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255, 255, 255, 0.16)",
  };
  const listLeft = cfg.prayer_time_position !== "right";
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: cfg.text_color }} data-testid="tv-layout-cinematic">
      <SlideShow data={data} cfg={cfg} now={now} className="absolute inset-0" testid="tv-slideshow-background" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(6,19,37,0.85) 0%, rgba(6,19,37,0.55) 45%, rgba(6,19,37,0.92) 100%)" }}
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-10 px-16 py-12">
        <div>
          <div className="text-[calc(2.6rem * var(--fs))] font-extrabold uppercase tracking-[0.2em]" data-testid="tv-mosque-name">
            {data.mosque.name}
          </div>
          <DateLines data={data} now={now} className="mt-3 items-start text-left text-[calc(1.2rem * var(--fs))] text-white/85" />
        </div>
        <div className="rounded-3xl px-10 py-6" style={glass}>
          <DigitalClock
            now={now}
            tz={data.mosque.timezone}
            style={{ fontSize: "calc(5rem * var(--cs))", color: "#FCD34D" }}
          />
        </div>
      </div>
      <div
        className={cn("absolute bottom-32 top-48 flex flex-col", listLeft ? "left-16" : "right-16")}
        style={{ width: "calc(30rem * var(--fs))" }}
      >
        <PrayerListVertical data={data} cfg={cfg} now={now} className="min-h-0 flex-1" />
      </div>
      <div
        className={cn("absolute bottom-32 top-48 flex flex-col gap-8", listLeft ? "right-16" : "left-16")}
        style={{ width: "calc(36rem * var(--fs))" }}
      >
        <div className="shrink-0 rounded-3xl p-8" style={glass} data-testid="tv-next-prayer-card">
          <NextPrayerCountdown data={data} cfg={cfg} now={now} />
        </div>
        <div className="min-h-0 flex-1">
          <ContentRotator data={data} cfg={cfg} now={now} className="h-full w-full" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <RunningTextBar data={data} cfg={cfg} />
      </div>
    </div>
  );
}
