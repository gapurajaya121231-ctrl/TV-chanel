import { cn } from "@/lib/utils";
import {
  ContentRotator,
  DateLines,
  DigitalClock,
  MurattalBadge,
  NextPrayerCountdown,
  PrayerListVertical,
  RunningTextBar,
  SlideShow,
  TvHeader,
  type TvLayoutProps,
} from "../shared";

// VERTICAL — informasi tersusun vertikal dalam layar landscape: panel kiri jadwal,
// panel kanan jam + konten. Semua informasi tetap terlihat.
export function VerticalLayout({ data, cfg, now }: TvLayoutProps) {
  const listLeft = cfg.prayer_time_position !== "right";
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-vertical"
    >
      <div className="flex min-h-0 flex-1 p-8">
        <div
          className={cn("flex min-h-0 flex-col", listLeft ? "order-1" : "order-3")}
          style={{ width: "calc(30rem * var(--fs))" }}
        >
          <PrayerListVertical data={data} cfg={cfg} now={now} className="h-full w-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-8 px-10">
          <div className="shrink-0">
            <TvHeader data={data} cfg={cfg} />
          </div>
          <div className="flex min-h-0 flex-1 gap-10">
            <div className="flex w-1/2 min-w-0 flex-col items-center justify-center gap-8">
              <DigitalClock
                now={now}
                tz={data.mosque.timezone}
                className="text-center"
                style={{ fontSize: "calc(6.5rem * var(--cs))", color: cfg.accent_color }}
              />
              <DateLines data={data} now={now} className="text-[calc(1.35rem * var(--fs))]" />
              <NextPrayerCountdown data={data} cfg={cfg} now={now} />
              <MurattalBadge data={data} now={now} />
            </div>
            <div className="flex w-1/2 min-w-0 flex-col gap-6">
              <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border-4" style={{ borderColor: cfg.accent_color }}>
                <SlideShow data={data} cfg={cfg} now={now} />
              </div>
              <div className="h-[calc(16rem * var(--fs))] shrink-0">
                <ContentRotator data={data} cfg={cfg} now={now} className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
