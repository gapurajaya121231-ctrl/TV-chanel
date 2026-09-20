import { cn } from "@/lib/utils";
import { PRAYER_LABELS, computeDisplayPhase, fmtCountdown, hexToRgba, tzTimeParts } from "@/lib/display";
import {
  DateLines,
  DigitalClock,
  MurattalBadge,
  PrayerListVertical,
  RunningTextBar,
  type TvLayoutProps,
} from "../shared";

// PRAYER FOCUS — fokus pada waktu shalat berikutnya: nama, jam, hitung mundur besar.
export function PrayerFocusLayout({ data, cfg, now }: TvLayoutProps) {
  const { secondsOfDay: nowSec } = tzTimeParts(now, data.mosque.timezone);
  const ph = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, nowSec);
  const soon = ph.phase === "normal" && ph.countdown <= 600;
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-prayer_focus"
    >
      <div className="absolute right-12 top-10 flex flex-col items-end gap-2">
        <DigitalClock now={now} tz={data.mosque.timezone} style={{ fontSize: "calc(3rem * var(--cs))", color: cfg.accent_color }} />
        <DateLines data={data} now={now} className="items-end text-right text-[calc(1rem * var(--fs))] text-white/80" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-7 px-16 pb-6">
          <div className="text-[calc(3.2rem * var(--fs))] font-extrabold uppercase tracking-wide" style={{ color: cfg.accent_color }} data-testid="tv-focus-prayer-name">
            {PRAYER_LABELS[ph.nextKey]}
          </div>
          <div className="font-mono text-[calc(3.2rem * var(--fs))] font-bold tabular-nums" data-testid="tv-focus-prayer-time">
            {ph.nextTime}
          </div>
          <div className="text-[calc(1.6rem * var(--fs))] font-semibold uppercase tracking-[0.5em] text-white/80">
            Menuju {PRAYER_LABELS[ph.nextKey]}
          </div>
          <div
            className={cn("font-mono text-[calc(8.5rem * var(--cs))] font-bold tabular-nums", soon && "animate-pulse-gold")}
            data-testid="tv-focus-countdown"
          >
            {fmtCountdown(ph.countdown)}
          </div>
          <DateLines data={data} now={now} className="text-[calc(1.3rem * var(--fs))] text-white/80" />
          <MurattalBadge data={data} now={now} />
        </div>
        <div
          className="flex min-h-0 flex-col p-10"
          style={{ width: "calc(26rem * var(--fs))", backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity) }}
        >
          <PrayerListVertical data={data} cfg={cfg} now={now} className="h-full w-full" />
        </div>
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
