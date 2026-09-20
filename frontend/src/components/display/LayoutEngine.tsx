// The Layout Engine: one data contract, eight visual templates. Layouts only change
// position, size, color, style and visual structure — never the data.
import type { CSSProperties } from "react";
import type { DisplayData, Layout, LayoutConfig } from "@/lib/types";
import type { DisplayPhase } from "@/lib/display";
import { AzanIqamahOverlay, type TvLayoutProps } from "./shared";
import { SignatureLayout } from "./layouts/SignatureLayout";
import { UltraWideLayout } from "./layouts/UltraWideLayout";
import { SimplicityLayout } from "./layouts/SimplicityLayout";
import { CinematicLayout } from "./layouts/CinematicLayout";
import { HorizontalLayout } from "./layouts/HorizontalLayout";
import { VerticalLayout } from "./layouts/VerticalLayout";
import { DigitalClockLayout } from "./layouts/DigitalClockLayout";
import { PrayerFocusLayout } from "./layouts/PrayerFocusLayout";

export function LayoutEngine({
  data,
  layout,
  config,
  now,
  phase,
}: {
  data: DisplayData;
  layout?: Layout; // preview a non-active template (admin catalog / modal)
  config?: LayoutConfig; // live-draft config override (customizer)
  now: Date;
  phase?: DisplayPhase | null;
}) {
  const active: Layout = layout ?? data.layout;
  const cfg: LayoutConfig = config ?? active.config;
  const view: DisplayData = layout ? { ...data, layout: active } : data;
  const rootStyle = {
    "--fs": String(cfg.font_size / 100),
    "--cs": String(cfg.clock_size / 100),
  } as CSSProperties;
  const props: TvLayoutProps = { data: view, cfg, now };

  let body;
  switch (active.key) {
    case "ultra_wide":
      body = <UltraWideLayout {...props} />;
      break;
    case "simplicity":
      body = <SimplicityLayout {...props} />;
      break;
    case "cinematic":
      body = <CinematicLayout {...props} />;
      break;
    case "horizontal":
      body = <HorizontalLayout {...props} />;
      break;
    case "vertical":
      body = <VerticalLayout {...props} />;
      break;
    case "digital_clock":
      body = <DigitalClockLayout {...props} />;
      break;
    case "prayer_focus":
      body = <PrayerFocusLayout {...props} />;
      break;
    case "signature":
    default:
      body = <SignatureLayout {...props} />;
      break;
  }

  return (
    <div data-testid={`tv-layout-${active.key}`} className="relative h-full w-full overflow-hidden" style={rootStyle}>
      {body}
      {phase && phase.phase !== "normal" && (
        <AzanIqamahOverlay phase={phase} cfg={cfg} data={view} />
      )}
    </div>
  );
}
