import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing, Building2, CalendarDays, Clock, FileText, Globe, Images, Languages,
  LayoutDashboard, MessageSquareText, Palette, QrCode, Settings, Timer, Tv, Volume2,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import type { MosqueProfile } from "@/lib/types";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const MENU = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, testid: "dashboard" },
  { path: "/admin/masjid-profile", label: "Masjid Profile", icon: Building2, testid: "masjid-profile" },
  { path: "/admin/prayer-time", label: "Prayer Time", icon: Clock, testid: "prayer-time" },
  { path: "/admin/layouts", label: "Layout Style", icon: Palette, testid: "layouts" },
  { path: "/admin/localization", label: "Localization", icon: Languages, testid: "localization" },
  { path: "/admin/main-slider", label: "Main Slider", icon: Images, testid: "main-slider" },
  { path: "/admin/info-slide", label: "Info Slide", icon: FileText, testid: "info-slide" },
  { path: "/admin/donation-slide", label: "Donation Slide", icon: QrCode, testid: "donation-slide" },
  { path: "/admin/islamic-event", label: "Islamic Event", icon: CalendarDays, testid: "islamic-event" },
  { path: "/admin/running-text", label: "Running Text", icon: MessageSquareText, testid: "running-text" },
  { path: "/admin/azan-screen", label: "Azan Screen", icon: BellRing, testid: "azan-screen" },
  { path: "/admin/iqamah-screen", label: "Iqamah Screen", icon: Timer, testid: "iqamah-screen" },
  { path: "/admin/scheduled-murattal", label: "Scheduled Murattal", icon: Volume2, testid: "scheduled-murattal" },
  { path: "/admin/masjid-web", label: "Masjid Web", icon: Globe, testid: "masjid-web" },
  { path: "/admin/display-preview", label: "Display Preview", icon: Tv, testid: "display-preview" },
  { path: "/admin/settings", label: "Settings", icon: Settings, testid: "settings" },
];

export default function AdminShell() {
  const { data: mosque } = useQuery({
    queryKey: ["mosque"],
    queryFn: () => apiGet<MosqueProfile>("/mosque"),
    retry: false,
    refetchInterval: 120_000,
  });

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Toaster />
      <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar" data-testid="admin-sidebar">
        <div className="border-b border-sidebar-border px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Masjid Display</p>
          <h1 className="mt-1 truncate text-lg font-bold text-sidebar-foreground" data-testid="admin-mosque-name">
            {mosque ? mosque.name : "Panel Admin"}
          </h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" data-testid="admin-sidebar-nav">
          {MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              data-testid={`admin-nav-${item.testid}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_3px_0_0_0_#F59E0B]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-6 py-4">
          <Link
            to="/display"
            data-testid="admin-open-display-link"
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Tv className="size-4" /> Buka Display TV
          </Link>
        </div>
      </aside>
      <main className="ml-72 p-8">
        <Outlet />
      </main>
    </div>
  );
}
