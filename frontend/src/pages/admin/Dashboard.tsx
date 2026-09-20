import { useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ExternalLink, FileText, Images, MessageSquareText, Palette } from "lucide-react";
import { apiGet } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import type { DisplayData, InfoSlide, IslamicEvent, RunningText, SliderImage } from "@/lib/types";
import { PRAYER_LABELS, PRAYER_ORDER, useClock } from "@/lib/display";
import { PageHeader } from "@/components/admin/forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TvFrame } from "@/components/display/TvFrame";
import { LayoutEngine } from "@/components/display/LayoutEngine";

type StatKey = "slider" | "info" | "events" | "running";

const STAT_META: Record<StatKey, { label: string; href: string; hrefLabel: string }> = {
  slider: { label: "Foto Slider", href: "/admin/main-slider", hrefLabel: "Kelola di Main Slider" },
  info: { label: "Info Slide", href: "/admin/info-slide", hrefLabel: "Kelola di Info Slide" },
  events: { label: "Kegiatan", href: "/admin/islamic-event", hrefLabel: "Kelola di Islamic Event" },
  running: { label: "Running Text", href: "/admin/running-text", hrefLabel: "Kelola di Running Text" },
};

function EmptyHint({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground" data-testid="dashboard-stat-empty">{text}</p>;
}

function StatDialogBody({
  stat, slider, info, events, running,
}: {
  stat: StatKey; slider?: SliderImage[]; info?: InfoSlide[]; events?: IslamicEvent[]; running?: RunningText[];
}) {
  if (stat === "slider") {
    if (!slider || slider.length === 0) return <EmptyHint text="Belum ada foto slider." />;
    return (
      <>
        {slider.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-2" data-testid={`dashboard-stat-item-${s.id}`}>
            <img src={s.url} alt={s.title || "Foto masjid"} className="h-10 w-16 shrink-0 rounded object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.title || "Tanpa judul"}</span>
            {s.is_utama && <Badge className="bg-primary text-primary-foreground">Utama</Badge>}
          </div>
        ))}
      </>
    );
  }
  if (stat === "info") {
    if (!info || info.length === 0) return <EmptyHint text="Belum ada info slide." />;
    return (
      <>
        {info.map((s) => (
          <div key={s.id} className="rounded-lg bg-secondary/40 p-3" data-testid={`dashboard-stat-item-${s.id}`}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/50 text-primary">{s.slide_type}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{s.title}</span>
              <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            {s.body && <p className="mt-1 truncate text-xs text-muted-foreground">{s.body}</p>}
          </div>
        ))}
      </>
    );
  }
  if (stat === "events") {
    if (!events || events.length === 0) return <EmptyHint text="Belum ada kegiatan." />;
    return (
      <>
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3" data-testid={`dashboard-stat-item-${e.id}`}>
            <div className="shrink-0 rounded bg-primary/15 px-2 py-1 text-center font-mono text-xs font-bold text-primary">
              {e.date}
              {e.time ? `\u00A0${e.time}` : ""}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{e.title}</div>
              {e.description && <div className="truncate text-xs text-muted-foreground">{e.description}</div>}
            </div>
          </div>
        ))}
      </>
    );
  }
  if (!running || running.length === 0) return <EmptyHint text="Belum ada running text." />;
  return (
    <>
      {running.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3" data-testid={`dashboard-stat-item-${t.id}`}>
          <span className="min-w-0 flex-1 truncate text-sm">{t.text}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{t.speed}s</span>
          <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Aktif" : "Nonaktif"}</Badge>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const now = useClock();
  const { data: display } = useQuery({ queryKey: ["display"], queryFn: () => apiGet<DisplayData>("/display"), refetchInterval: 60_000 });
  const { data: slider } = useQuery({ queryKey: ["slider"], queryFn: () => apiGet<SliderImage[]>("/slider") });
  const { data: info } = useQuery({ queryKey: ["info-slides"], queryFn: () => apiGet<InfoSlide[]>("/info-slides") });
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: () => apiGet<IslamicEvent[]>("/events") });
  const { data: running } = useQuery({ queryKey: ["running-texts"], queryFn: () => apiGet<RunningText[]>("/running-texts") });
  const [openStat, setOpenStat] = useState<StatKey | null>(null);

  const counts: Record<StatKey, number> = {
    slider: slider?.length ?? 0,
    info: info?.filter((s) => s.is_active).length ?? 0,
    events: events?.length ?? 0,
    running: running?.filter((r) => r.is_active).length ?? 0,
  };

  const statKeys: StatKey[] = ["slider", "info", "events", "running"];
  const statIcons: Record<StatKey, typeof Images> = { slider: Images, info: FileText, events: CalendarDays, running: MessageSquareText };
  const statLabels: Record<StatKey, string> = { slider: "Foto Slider", info: "Info Slide Aktif", events: "Kegiatan Terjadwal", running: "Running Text Aktif" };

  const openOnKey = (e: KeyboardEvent, key: StatKey) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenStat(key);
    }
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan tampilan TV masjid. Ketuk kartu untuk melihat isinya, atau ketuk pratinjau TV untuk membuka display." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statKeys.map((key) => {
          const Icon = statIcons[key];
          return (
            <Card
              key={key}
              data-testid={`dashboard-stat-card-${key}`}
              role="button"
              tabIndex={0}
              onClick={() => setOpenStat(key)}
              onKeyDown={(e) => openOnKey(e, key)}
              className="cursor-pointer transition-colors hover:border-primary/60"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/15 p-3 text-primary"><Icon className="size-5" /></div>
                <div>
                  <div className="text-2xl font-bold" data-testid={`dashboard-stat-value-${key}`}>{counts[key]}</div>
                  <div className="text-sm text-muted-foreground">{statLabels[key]}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold" data-testid="dashboard-preview-title">Pratinjau TV (Layout Aktif)</h2>
              {display && (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary" data-testid="dashboard-active-layout">
                  {display.layout.name}
                </span>
              )}
            </div>
            <div
              className="cursor-pointer overflow-hidden rounded-xl transition-shadow hover:ring-2 hover:ring-primary/60"
              data-testid="dashboard-preview-tappable"
              onClick={() => window.open("/display", "_blank")}
              title="Ketuk untuk membuka Display TV"
            >
              {display ? (
                <TvFrame>
                  <LayoutEngine data={display} now={now} />
                </TvFrame>
              ) : (
                <div className="aspect-video w-full animate-pulse rounded-xl bg-secondary/40" data-testid="dashboard-preview-skeleton" />
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Link to="/admin/display-preview" data-testid="dashboard-preview-link" className="text-sm font-semibold text-primary hover:underline">
                Buka Display Preview <ExternalLink className="inline size-4" />
              </Link>
              <Link to="/admin/layouts" data-testid="dashboard-layouts-link" className="text-sm font-semibold text-primary hover:underline">
                <Palette className="inline size-4" /> Ganti Layout
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-bold" data-testid="dashboard-times-title">Jadwal Shalat Hari Ini</h2>
              {display ? (
                <div className="space-y-2">
                  {PRAYER_ORDER.filter((k) => k !== "imsak" || display.settings.show_imsak).map((k) => (
                    <div key={k} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2" data-testid={`dashboard-prayer-${k}`}>
                      <span className="text-sm font-medium">{PRAYER_LABELS[k]}</span>
                      <span className="font-mono font-bold tabular-nums">{display.prayer_times.times[k]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 animate-pulse rounded-lg bg-secondary/40" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-bold" data-testid="dashboard-events-title">Kegiatan Mendatang</h2>
              {display && display.events.length > 0 ? (
                <ul className="space-y-3" data-testid="dashboard-events-list">
                  {display.events.slice(0, 4).map((e) => (
                    <li key={e.id} className="rounded-lg bg-secondary/40 px-4 py-3">
                      <div className="text-sm font-bold">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.date}{e.time ? ` • ${e.time}` : ""}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada kegiatan mendatang.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openStat !== null} onOpenChange={(o) => { if (!o) setOpenStat(null); }}>
        <DialogContent className="max-w-xl" data-testid="dashboard-stat-dialog">
          <DialogHeader>
            <DialogTitle data-testid="dashboard-stat-dialog-title">{openStat ? STAT_META[openStat].label : ""}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1 pt-2" data-testid="dashboard-stat-dialog-list">
            {openStat && <StatDialogBody stat={openStat} slider={slider} info={info} events={events} running={running} />}
          </div>
          {openStat && (
            <Link to={STAT_META[openStat].href} data-testid="dashboard-stat-dialog-open-page" className={buttonVariants({ variant: "outline" })}>
              {STAT_META[openStat].hrefLabel} <ExternalLink className="size-4" />
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
