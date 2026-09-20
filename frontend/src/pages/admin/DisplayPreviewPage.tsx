import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Maximize2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { DisplayData } from "@/lib/types";
import { useClock } from "@/lib/display";
import { PageHeader } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { TvFrame } from "@/components/display/TvFrame";
import { LayoutEngine } from "@/components/display/LayoutEngine";

export default function DisplayPreviewPage() {
  const now = useClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: display } = useQuery({
    queryKey: ["display"],
    queryFn: () => apiGet<DisplayData>("/display"),
    refetchInterval: 60_000,
  });

  const goFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void el.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <div>
      <PageHeader
        title="Display Preview"
        description="Pratinjau tampilan TV dengan layout aktif. Klik Open Display untuk membuka halaman TV di tab baru (mode kiosk)."
      >
        <div className="flex gap-3">
          <Button variant="outline" data-testid="preview-fullscreen-button" onClick={goFullscreen}>
            <Maximize2 className="size-4" /> Fullscreen
          </Button>
          <a href="/display" target="_blank" rel="noreferrer" data-testid="preview-open-display-button" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <ExternalLink className="size-4" /> Open Display
          </a>
        </div>
      </PageHeader>

      <div ref={containerRef} className="rounded-2xl border border-border bg-black p-4" data-testid="preview-container">
        {display ? (
          <TvFrame>
            <LayoutEngine data={display} now={now} />
          </TvFrame>
        ) : (
          <div className="aspect-video w-full animate-pulse rounded-xl bg-secondary/40" data-testid="preview-skeleton" />
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground" data-testid="preview-hint">
        Halaman /display dirancang 16:9 Full HD (1920×1080), tanpa scroll, dengan Wake Lock agar layar TV tetap menyala.
      </p>
    </div>
  );
}
