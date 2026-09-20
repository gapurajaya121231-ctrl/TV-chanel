import { cn } from "@/lib/utils";
import { PRAYER_LABELS, computeDisplayPhase, fmtCountdown, tzTimeParts } from "@/lib/display";
import {
  DigitalClock,
  MurattalBadge,
  PrayerRowHorizontal,
  RunningTextBar,
  type TvLayoutProps,
} from "../shared";

// DIGITAL CLOCK — jam digital raksasa, nama salat berikutnya + countdown besar.
export function DigitalClockLayout({ data, cfg, now }: TvLayoutProps) {
  const { secondsOfDay: nowSec } = tzTimeParts(now, data.mosque.timezone);
  const ph = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, nowSec);
  const soon = ph.phase === "normal" && ph.countdown <= 600;
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-digital_clock"
    >
      <div className="flex shrink-0 items-center justify-center pt-10">
        <div className="text-[calc(1.5rem * var(--fs))] font-bold uppercase tracking-[0.45em]" style={{ color: cfg.accent_color }} data-testid="tv-mosque-name">
          {data.mosque.name}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
        <DigitalClock now={now} tz={data.mosque.timezone} style={{ fontSize: "calc(13.5rem * var(--cs))" }} />
        <div className="text-[calc(3rem * var(--fs))] font-extrabold uppercase tracking-[0.3em]" style={{ color: cfg.accent_color }} data-testid="tv-next-prayer-name">
          {PRAYER_LABELS[ph.nextKey]}
        </div>
        <div className={cn("font-mono text-[calc(6rem * var(--cs))] font-bold tabular-nums", soon && "animate-pulse-gold")} data-testid="tv-next-prayer-countdown">
          {fmtCountdown(ph.countdown)}
        </div>
        <MurattalBadge data={data} now={now} />
      </div>
      <div className="shrink-0 px-16 pb-8">
        <PrayerRowHorizontal data={data} cfg={cfg} now={now} />
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
