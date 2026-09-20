// Shared building blocks for all TV layouts. Every scalable text size uses
// calc(<n>rem * var(--fs)) (font scale) or var(--cs) (clock scale) so the
// per-layout Font Size / Clock Size settings apply live without reload.
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  PRAYER_LABELS,
  PRAYER_ORDER,
  activeMurattal,
  computeDisplayPhase,
  fmtCountdown,
  fmtMinutes,
  hexToRgba,
  tzTimeParts,
} from "@/lib/display";
import type { DisplayPhase } from "@/lib/display";
import type { DonationSlide, DisplayData, InfoSlide, LayoutConfig } from "@/lib/types";

export interface TvLayoutProps {
  data: DisplayData;
  cfg: LayoutConfig;
  now: Date;
}

// --- Clock -------------------------------------------------------------------

export function DigitalClock({
  now, tz, className, style, testid = "tv-clock",
}: {
  now: Date; tz: string; className?: string; style?: CSSProperties; testid?: string;
}) {
  const hhmmss = tzTimeParts(now, tz).hhmmss;
  return (
    <div className={cn("font-mono font-bold tabular-nums leading-none tracking-tight", className)} style={style} data-testid={testid}>
      {hhmmss}
    </div>
  );
}

// --- Dates -------------------------------------------------------------------

export function DateLines({ data, now, className }: { data: DisplayData; now: Date; className?: string }) {
  const { dateLine } = tzTimeParts(now, data.mosque.timezone);
  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-testid="tv-date-lines">
      <div data-testid="tv-date-gregorian">{dateLine}</div>
      {data.settings.show_hijri && (
        <div data-testid="tv-date-hijri" style={{ color: "#FCD34D" }}>
          {data.prayer_times.hijri.formatted}
        </div>
      )}
    </div>
  );
}

// --- Header (logo + mosque name + address) -----------------------------------

export function TvHeader({ data, cfg, alignDate }: { data: DisplayData; cfg: LayoutConfig; alignDate?: boolean }) {
  const justify =
    cfg.mosque_name_position === "left" ? "items-start text-left"
    : cfg.mosque_name_position === "right" ? "items-end text-right"
    : "items-center text-center";
  const logoOrder =
    cfg.logo_position === "right" ? "order-3" : cfg.logo_position === "center" ? "order-2" : "order-1";
  return (
    <div className="flex items-center gap-8" data-testid="tv-header">
      {cfg.logo_position !== "hidden" && data.mosque.logo_url && (
        <img
          src={data.mosque.logo_url}
          alt="Logo masjid"
          data-testid="tv-logo"
          className={cn("h-[calc(5rem*var(--fs))] w-[calc(5rem*var(--fs))] rounded-full bg-white/90 object-contain p-1", logoOrder)}
        />
      )}
      <div className={cn("flex flex-1 flex-col gap-1", justify)}>
        <div className="text-[calc(2.8rem*var(--fs))] font-extrabold uppercase tracking-wide" data-testid="tv-mosque-name">
          {data.mosque.name}
        </div>
        {(data.mosque.address || alignDate === undefined) && (
          <div className="text-[calc(1.15rem*var(--fs))] text-white/75" data-testid="tv-mosque-address">
            {data.mosque.address}
            {data.mosque.address && data.mosque.city ? `, ${data.mosque.city}` : data.mosque.city}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Prayer lists ------------------------------------------------------------

export function PrayerListVertical({ data, cfg, now, className }: TvLayoutProps & { className?: string }) {
  const { secondsOfDay: nowSec } = tzTimeParts(now, data.mosque.timezone);
  const ph = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, nowSec);
  const keys = PRAYER_ORDER.filter((k) => k !== "imsak" || data.settings.show_imsak);
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-3xl", className)}
      style={{ backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity) }}
      data-testid="tv-prayer-list"
    >
      <div
        className="px-8 py-6 text-center text-[calc(1.5rem*var(--fs))] font-extrabold uppercase tracking-[0.35em]"
        style={{ backgroundColor: hexToRgba(cfg.accent_color, 0.95), color: cfg.secondary_color }}
        data-testid="tv-prayer-list-title"
      >
        Jadwal Shalat
      </div>
      <div className="flex flex-1 flex-col justify-around px-8 py-5">
        {keys.map((k) => {
          const highlight = (k === ph.nextKey && ph.phase === "normal") || (k === ph.prayerKey && ph.phase !== "normal");
          return (
            <div
              key={k}
              data-testid={`tv-prayer-row-${k}`}
              className="flex items-center justify-between rounded-2xl px-5 py-[calc(0.55rem*var(--fs))]"
              style={highlight ? { backgroundColor: cfg.accent_color, color: cfg.secondary_color } : undefined}
            >
              <span className="text-[calc(1.6rem*var(--fs))] font-semibold">{PRAYER_LABELS[k]}</span>
              <span className="font-mono text-[calc(1.9rem*var(--fs))] font-bold tabular-nums">{data.prayer_times.times[k]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PrayerRowHorizontal({ data, cfg, now, className }: TvLayoutProps & { className?: string }) {
  const { secondsOfDay: nowSec } = tzTimeParts(now, data.mosque.timezone);
  const ph = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, nowSec);
  const keys = PRAYER_ORDER.filter((k) => k !== "imsak" || data.settings.show_imsak);
  return (
    <div
      className={cn("grid overflow-hidden rounded-3xl", className)}
      style={{ backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity), gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }}
      data-testid="tv-prayer-row"
    >
      {keys.map((k) => {
        const highlight = (k === ph.nextKey && ph.phase === "normal") || (k === ph.prayerKey && ph.phase !== "normal");
        return (
          <div
            key={k}
            data-testid={`tv-prayer-row-${k}`}
            className="flex flex-col items-center justify-center gap-3 py-7"
            style={highlight ? { backgroundColor: cfg.accent_color, color: cfg.secondary_color } : undefined}
          >
            <span className="text-[calc(1.35rem*var(--fs))] font-semibold uppercase tracking-widest">{PRAYER_LABELS[k]}</span>
            <span className="font-mono text-[calc(2.4rem*var(--fs))] font-bold tabular-nums">{data.prayer_times.times[k]}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Next prayer countdown -----------------------------------------------------

export function NextPrayerCountdown({ data, cfg, now, className }: TvLayoutProps & { className?: string }) {
  const { secondsOfDay: nowSec } = tzTimeParts(now, data.mosque.timezone);
  const ph = computeDisplayPhase(data.prayer_times, data.azan, data.iqamah, nowSec);
  const soon = ph.phase === "normal" && ph.countdown <= 600;
  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-testid="tv-next-prayer">
      <div className="text-[calc(1.3rem*var(--fs))] font-semibold uppercase tracking-[0.35em]" style={{ color: cfg.accent_color }}>
        Menuju {PRAYER_LABELS[ph.nextKey]}
      </div>
      <div
        className={cn("font-mono text-[calc(3.4rem*var(--cs))] font-bold tabular-nums", soon && "animate-pulse-gold")}
        data-testid="tv-next-prayer-countdown"
      >
        {fmtCountdown(ph.countdown)}
      </div>
    </div>
  );
}

// --- Background slideshow ------------------------------------------------------

export function SlideShow({ data, cfg, className, testid = "tv-slideshow" }: TvLayoutProps & { className?: string; testid?: string }) {
  const slides = data.slides;
  const enabled = data.settings.slideshow_enabled && slides.length > 0;
  const intervalMs = Math.max(5, data.settings.slideshow_interval) * 1000;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!enabled || slides.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, slides.length]);

  if (!enabled) {
    const photo = data.mosque.photo_url;
    return photo ? (
      <img src={photo} alt="Masjid" className={cn("h-full w-full object-cover", className)} style={{ objectPosition: cfg.background_position }} data-testid={testid} />
    ) : null;
  }
  const current = slides.length ? idx % slides.length : 0;
  return (
    <div className={cn("relative h-full w-full", className)} data-testid={testid}>
      {slides.map((s, i) => (
        <img
          key={s.id}
          src={s.url}
          alt={s.title || "Foto masjid"}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", i === current ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: cfg.background_position }}
        />
      ))}
    </div>
  );
}

// --- Info + donation rotator -----------------------------------------------------

function InfoCard({ slide, cfg }: { slide: InfoSlide; cfg: LayoutConfig }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-3 rounded-3xl p-8"
      style={{ backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity) }}
      data-testid="tv-info-card"
    >
      <span className="w-fit rounded-full px-4 py-1 text-[calc(0.95rem*var(--fs))] font-bold uppercase tracking-widest" style={{ backgroundColor: cfg.accent_color, color: cfg.secondary_color }}>
        {slide.slide_type}
      </span>
      <div className="text-[calc(1.7rem*var(--fs))] font-extrabold" data-testid="tv-info-title">{slide.title}</div>
      <p className="text-[calc(1.15rem*var(--fs))] leading-relaxed text-white/90" data-testid="tv-info-body">{slide.body}</p>
    </div>
  );
}

function DonationCard({ donation, cfg }: { donation: DonationSlide; cfg: LayoutConfig }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center rounded-3xl p-8"
      style={{ backgroundColor: hexToRgba(cfg.primary_color, cfg.panel_opacity) }}
      data-testid="tv-donation-card"
    >
      <div className="flex items-center gap-8">
        {donation.qr_url && (
          <img src={donation.qr_url} alt="QR Donasi" data-testid="tv-donation-qr" className="h-[calc(10.5rem*var(--fs))] w-[calc(10.5rem*var(--fs))] shrink-0 rounded-2xl bg-white p-3" />
        )}
        <div className="min-w-0">
          <div className="text-[calc(1.7rem*var(--fs))] font-extrabold" style={{ color: cfg.accent_color }} data-testid="tv-donation-title">
            {donation.title}
          </div>
          <p className="mt-2 text-[calc(1.1rem*var(--fs))] leading-snug text-white/90" data-testid="tv-donation-text">{donation.text}</p>
          {donation.account_number && (
            <div className="mt-4 text-[calc(1.15rem*var(--fs))]" data-testid="tv-donation-account">
              <div className="font-bold">{donation.bank_name}</div>
              <div className="font-mono text-[calc(1.7rem*var(--fs))] font-bold tracking-wider">{donation.account_number}</div>
              {donation.account_name && <div className="text-white/80">a.n. {donation.account_name}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContentRotator({ data, cfg, className }: TvLayoutProps & { className?: string }) {
  const items = [
    ...(data.donation?.is_active ? [{ key: "donation", node: <DonationCard donation={data.donation} cfg={cfg} /> }] : []),
    ...data.info_slides.filter((s) => s.is_active).map((s) => ({ key: s.id, node: <InfoCard slide={s} cfg={cfg} /> })),
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % items.length), 10_000);
    return () => window.clearInterval(id);
  }, [items.length]);
  if (items.length === 0) return null;
  const current = items[idx % items.length];
  return (
    <div className={cn("animate-tv-fade-in", className)} key={current.key} data-testid="tv-content-rotator">
      {current.node}
    </div>
  );
}

// --- Running text ----------------------------------------------------------------

export function RunningTextBar({ data, cfg }: { data: DisplayData; cfg: LayoutConfig }) {
  const active = data.running_texts.filter((t) => t.is_active);
  if (!data.settings.show_running_text || active.length === 0) return null;
  const speed = Math.round(active.reduce((sum, t) => sum + Math.max(10, t.speed), 0) / active.length);
  const layoutScale = Math.max(0.6, Math.min(2, cfg.running_text_size / 100)); // layout-wide scale
  const sizeOf = (t: { size: number }) => {
    const textScale = Math.max(0.6, Math.min(2, (t.size || 100) / 100)); // per-text scale
    return `calc(${(1.5 * layoutScale * textScale).toFixed(3)}rem * var(--fs))`;
  };
  // Largest text drives the label + bar height so nothing is clipped.
  const labelSize = `calc(${(1.5 * layoutScale * Math.max(...active.map((t) => Math.max(0.6, Math.min(2, (t.size || 100) / 100))))).toFixed(3)}rem * var(--fs))`;

  const sequence = (
    <>
      {active.map((t) => (
        <span key={t.id} className="px-10 font-medium" style={{ fontSize: sizeOf(t) }} data-testid={`tv-running-text-item-${t.id}`}>
          {t.text}
        </span>
      ))}
    </>
  );

  return (
    <div className="flex shrink-0 items-stretch overflow-hidden" style={{ backgroundColor: hexToRgba(cfg.secondary_color, 0.96) }} data-testid="tv-running-text">
      <span
        className="flex shrink-0 items-center px-8 font-extrabold uppercase tracking-widest"
        style={{ backgroundColor: cfg.accent_color, color: cfg.secondary_color, fontSize: labelSize }}
        data-testid="tv-running-text-label"
      >
        Info
      </span>
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap" style={{ animationDuration: `${speed}s` }} data-testid="tv-running-text-content">
          {sequence}
          {sequence}
        </div>
      </div>
    </div>
  );
}

// --- Murattal badge ---------------------------------------------------------------

export function MurattalBadge({ data, now }: { data: DisplayData; now: Date }) {
  const m = activeMurattal(data.murattal, tzTimeParts(now, data.mosque.timezone).secondsOfDay);
  if (!m) return null;
  return (
    <div
      data-testid="tv-murattal-badge"
      className="rounded-full px-6 py-2 text-[calc(1.05rem*var(--fs))] font-bold uppercase tracking-widest"
      style={{ backgroundColor: "#10B981", color: "#050C1A" }}
    >
      {m.title} — Sedang Berlangsung
    </div>
  );
}

// --- Azan / Iqamah full-screen overlay (rendered above any layout) -----------------

export function AzanIqamahOverlay({
  phase, cfg, data,
}: {
  phase: DisplayPhase;
  cfg: LayoutConfig;
  data: DisplayData;
}) {
  const label = PRAYER_LABELS[phase.prayerKey ?? ""] ?? "";
  return (
    <div
      className="animate-tv-zoom-in absolute inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: "rgba(5, 12, 26, 0.97)" }}
      data-testid="tv-azan-overlay"
    >
      <div className="text-[calc(1.8rem*var(--fs))] font-bold uppercase tracking-[0.5em]" style={{ color: "#FBBF24" }} data-testid="tv-overlay-phase">
        {phase.phase === "azan" ? "Waktu Azan" : "Iqamah"}
      </div>
      <div className="text-[calc(6.5rem*var(--cs))] font-extrabold uppercase tracking-wide" style={{ color: cfg.accent_color }} data-testid="tv-overlay-prayer-name">
        {phase.phase === "azan" ? `Waktu ${label}` : label}
      </div>
      {phase.phase === "azan" && (
        <div className="max-w-5xl text-center text-[calc(1.6rem*var(--fs))] leading-relaxed text-white/90" data-testid="tv-azan-message">
          {data.azan.message}
        </div>
      )}
      {data.iqamah.enabled && (
        <div className="flex flex-col items-center gap-3" data-testid="tv-iqamah-countdown">
          <div className="text-[calc(1.4rem*var(--fs))] font-semibold uppercase tracking-[0.35em] text-white/80">
            {phase.phase === "iqamah" ? data.iqamah.message || "Iqamah Dalam" : "Menjelang Iqamah"}
          </div>
          <div className="animate-pulse-gold font-mono text-[calc(5.5rem*var(--cs))] font-bold tabular-nums" style={{ color: "#EF4444" }} data-testid="tv-iqamah-count">
            {fmtMinutes(phase.iqamahRemaining)}
          </div>
        </div>
      )}
    </div>
  );
}
