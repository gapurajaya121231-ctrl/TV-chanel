import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/display";
import {
  DateLines,
  DigitalClock,
  MurattalBadge,
  NextPrayerCountdown,
  PrayerRowHorizontal,
  RunningTextBar,
  TvHeader,
  type TvLayoutProps,
} from "../shared";

// HORIZONTAL — jam besar di tengah, info salat berikutnya menonjol, baris jadwal horizontal.
export function HorizontalLayout({ data, cfg, now }: TvLayoutProps) {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-horizontal"
    >
      <div className="shrink-0 px-16 pt-10">
        <TvHeader data={data} cfg={cfg} />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-24 px-16">
        <DigitalClock
          now={now}
          tz={data.mosque.timezone}
          style={{ fontSize: "calc(9.5rem * var(--cs))", color: cfg.accent_color }}
        />
        <div className="h-56 w-px" style={{ backgroundColor: hexToRgba(cfg.accent_color, 0.5) }} />
        <div className="flex flex-col items-center gap-6">
          <NextPrayerCountdown data={data} cfg={cfg} now={now} />
          <MurattalBadge data={data} now={now} />
        </div>
      </div>
      <div className="shrink-0 px-16 pb-8">
        <DateLines data={data} now={now} className="mb-6 text-[calc(1.35rem * var(--fs))] text-white/85" />
        <PrayerRowHorizontal data={data} cfg={cfg} now={now} />
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
