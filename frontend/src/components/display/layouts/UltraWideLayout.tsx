import {
  DateLines,
  DigitalClock,
  NextPrayerCountdown,
  PrayerRowHorizontal,
  RunningTextBar,
  SlideShow,
  type TvLayoutProps,
} from "../shared";
import { hexToRgba } from "@/lib/display";

// ULTRA WIDE — foto masjid dominan penuh layar, jadwal horizontal di bagian bawah.
export function UltraWideLayout({ data, cfg, now }: TvLayoutProps) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: cfg.text_color }} data-testid="tv-layout-ultra_wide">
      <SlideShow data={data} cfg={cfg} now={now} className="absolute inset-0" testid="tv-slideshow-background" />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${hexToRgba(cfg.secondary_color, 0.88)} 0%, ${hexToRgba(cfg.secondary_color, 0.3)} 36%, ${hexToRgba(cfg.secondary_color, 0.22)} 55%, ${hexToRgba(cfg.secondary_color, 0.94)} 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-10 px-16 py-12">
        <div className="flex items-center gap-8">
          {cfg.logo_position !== "hidden" && data.mosque.logo_url && (
            <img
              src={data.mosque.logo_url}
              alt="Logo masjid"
              data-testid="tv-logo"
              className="h-[calc(5.5rem * var(--fs))] w-[calc(5.5rem * var(--fs))] rounded-full bg-white/90 object-contain p-1"
            />
          )}
          <div>
            <div className="text-[calc(3rem * var(--fs))] font-extrabold uppercase tracking-wide" data-testid="tv-mosque-name">
              {data.mosque.name}
            </div>
            <DateLines data={data} now={now} className="mt-3 items-start text-left text-[calc(1.2rem * var(--fs))] text-white/85" />
          </div>
        </div>
        <DigitalClock
          now={now}
          tz={data.mosque.timezone}
          style={{ fontSize: "calc(5.5rem * var(--cs))", color: cfg.accent_color }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div className="flex justify-end px-16 pb-5">
          <div
            className="rounded-3xl px-10 py-5"
            style={{ backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity) }}
          >
            <NextPrayerCountdown data={data} cfg={cfg} now={now} />
          </div>
        </div>
        <div className="px-16">
          <PrayerRowHorizontal data={data} cfg={cfg} now={now} />
        </div>
        <div className="mt-6">
          <RunningTextBar data={data} cfg={cfg} />
        </div>
      </div>
    </div>
  );
}
