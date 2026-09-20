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

// SIGNATURE — biru Islami + aksen emas: jadwal kiri, jam tengah, foto masjid kanan.
export function SignatureLayout({ data, cfg, now }: TvLayoutProps) {
  const prayersRight = cfg.prayer_time_position === "right";
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-signature"
    >
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: cfg.accent_color }} />
      <div className="shrink-0 px-16 pt-8">
        <TvHeader data={data} cfg={cfg} />
      </div>
      <div className="flex min-h-0 flex-1 items-stretch gap-10 px-16 py-8">
        <div
          className={cn("flex shrink-0 flex-col", prayersRight && "order-3")}
          style={{ width: "calc(27rem * var(--fs))" }}
        >
          <PrayerListVertical data={data} cfg={cfg} now={now} className="h-full w-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-10">
          <DigitalClock
            now={now}
            tz={data.mosque.timezone}
            className="text-center"
            style={{ fontSize: "calc(8.5rem * var(--cs))", color: cfg.accent_color }}
          />
          <DateLines data={data} now={now} className="text-[calc(1.5rem * var(--fs))]" />
          <NextPrayerCountdown data={data} cfg={cfg} now={now} />
          <MurattalBadge data={data} now={now} />
        </div>
        <div
          className={cn("flex shrink-0 flex-col gap-6", prayersRight && "order-1")}
          style={{ width: "calc(30rem * var(--fs))" }}
        >
          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border-4" style={{ borderColor: cfg.accent_color }}>
            <SlideShow data={data} cfg={cfg} now={now} />
          </div>
          <div className="h-[calc(15rem * var(--fs))] shrink-0">
            <ContentRotator data={data} cfg={cfg} now={now} className="h-full w-full" />
          </div>
        </div>
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
