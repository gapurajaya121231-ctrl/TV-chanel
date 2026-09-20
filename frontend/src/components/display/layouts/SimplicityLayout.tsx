import {
  DateLines,
  DigitalClock,
  MurattalBadge,
  NextPrayerCountdown,
  PrayerRowHorizontal,
  RunningTextBar,
  type TvLayoutProps,
} from "../shared";

// SIMPLICITY — minimalis: jam besar, jadwal mudah dibaca, tanpa dekorasi.
export function SimplicityLayout({ data, cfg, now }: TvLayoutProps) {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: cfg.bg_color, color: cfg.text_color }}
      data-testid="tv-layout-simplicity"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-16">
        <div className="text-[calc(1.4rem * var(--fs))] font-bold uppercase tracking-[0.5em]" style={{ color: cfg.accent_color }} data-testid="tv-mosque-name">
          {data.mosque.name}
        </div>
        <DigitalClock now={now} tz={data.mosque.timezone} style={{ fontSize: "calc(10.5rem * var(--cs))" }} />
        <DateLines data={data} now={now} className="text-[calc(1.5rem * var(--fs))] text-white/80" />
        <NextPrayerCountdown data={data} cfg={cfg} now={now} />
        <MurattalBadge data={data} now={now} />
      </div>
      <div className="shrink-0 px-20 pb-10">
        <PrayerRowHorizontal data={data} cfg={cfg} now={now} className="border border-white/10" />
      </div>
      <RunningTextBar data={data} cfg={cfg} />
    </div>
  );
}
