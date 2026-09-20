import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ExternalLink, FileText, Images, MessageSquareText, Palette } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { DisplayData, InfoSlide, IslamicEvent, RunningText, SliderImage } from "@/lib/types";
import { PRAYER_LABELS, PRAYER_ORDER } from "@/lib/display";
import { PageHeader } from "@/components/admin/forms";
import { Card, CardContent } from "@/components/ui/card";
import { TvFrame } from "@/components/display/TvFrame";
import { LayoutEngine } from "@/components/display/LayoutEngine";
import { useClock } from "@/lib/display";

export default function Dashboard() {
  const now = useClock();
  const { data: display } = useQuery({ queryKey: ["display"], queryFn: () => apiGet<DisplayData>("/display"), refetchInterval: 60_000 });
  const { data: slider } = useQuery({ queryKey: ["slider"], queryFn: () => apiGet<SliderImage[]>("/slider") });
  const { data: info } = useQuery({ queryKey: ["info-slides"], queryFn: () => apiGet<InfoSlide[]>("/info-slides") });
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: () => apiGet<IslamicEvent[]>("/events") });
  const { data: running } = useQuery({ queryKey: ["running-texts"], queryFn: () => apiGet<RunningText[]>("/running-texts") });

  const stats = [
    { label: "Foto Slider", value: slider?.length ?? 0, icon: Images, testid: "stat-slider" },
    { label: "Info Slide Aktif", value: info?.filter((s) => s.is_active).length ?? 0, icon: FileText, testid: "stat-info" },
    { label: "Kegiatan Terjadwal", value: events?.length ?? 0, icon: CalendarDays, testid: "stat-events" },
    { label: "Running Text Aktif", value: running?.filter((r) => r.is_active).length ?? 0, icon: MessageSquareText, testid: "stat-running" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan tampilan TV masjid: layout aktif, jadwal shalat hari ini, dan konten yang sedang ditayangkan."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} data-testid={s.testid}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-primary/15 p-3 text-primary"><s.icon className="size-5" /></div>
              <div>
                <div className="text-2xl font-bold" data-testid={`${s.testid}-value`}>{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            {display ? (
              <TvFrame>
                <LayoutEngine data={display} now={now} />
              </TvFrame>
            ) : (
              <div className="aspect-video w-full animate-pulse rounded-xl bg-secondary/40" data-testid="dashboard-preview-skeleton" />
            )}
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
    </div>
  );
}
