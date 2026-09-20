// Scales a fixed 1920x1080 TV design to any container (admin preview cards) or the
// full viewport (/display) — letterboxed, never overflowing, never scrollable.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TvFrame({
  children,
  className,
  fit = "width",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  fit?: "width" | "viewport";
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / 1920, el.clientHeight / 1080));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      onClick={onClick}
      data-testid="tv-frame"
      className={cn("overflow-hidden bg-black", fit === "viewport" ? "fixed inset-0" : "relative aspect-video w-full", className)}
    >
      <div
        className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px]"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
