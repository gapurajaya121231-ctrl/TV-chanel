import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BellRing, Images, LayoutDashboard, Palette, Tv } from "lucide-react";
import { apiGet } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import type { MosqueProfile } from "@/lib/types";

const FEATURES = [
  { icon: Palette, title: "8 Template Layout", desc: "Signature, Ultra Wide, Simplicity, Cinematic, Horizontal, Vertical, Digital Clock, Prayer Focus." },
  { icon: BellRing, title: "Azan & Iqamah", desc: "Countdown otomatis menuju azan dan iqamah sesuai pengaturan jeda tiap waktu shalat." },
  { icon: Images, title: "Slideshow & Running Text", desc: "Foto masjid, info slide, donasi QR, kegiatan Islam, dan running text dalam satu layar." },
];

export default function Home() {
  // Non-blocking probe: the shell renders identically with or without the backend.
  const { data } = useQuery({
    queryKey: ["mosque"],
    queryFn: () => apiGet<MosqueProfile>("/mosque"),
    retry: false,
    refetchInterval: 60_000,
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-primary">
          Digital Signage Masjid
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl" data-testid="home-title">
          {data ? data.name : "Masjid Display"}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Jadwal shalat, jam digital, tanggal Hijriah, countdown azan &amp; iqamah,
          slideshow foto masjid, dan running text — dalam satu layar TV yang selalu menyala.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/display"
            data-testid="home-open-display-button"
            className={buttonVariants({ size: "lg" })}
          >
            <Tv className="size-5" />
            Buka Display TV
          </Link>
          <Link
            to="/admin"
            data-testid="home-open-admin-button"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <LayoutDashboard className="size-5" />
            Panel Admin
          </Link>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card/60 p-5"
              data-testid="home-feature-card"
            >
              <f.icon className="size-6 text-primary" />
              <h2 className="mt-3 text-sm font-bold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
