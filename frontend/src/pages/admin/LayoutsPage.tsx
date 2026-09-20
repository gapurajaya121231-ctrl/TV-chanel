import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { DisplayData, Layout, LayoutConfig } from "@/lib/types";
import { useClock } from "@/lib/display";
import { Field, PageHeader, TextAreaInput, TextInput } from "@/components/admin/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TvFrame } from "@/components/display/TvFrame";
import { LayoutEngine } from "@/components/display/LayoutEngine";
import { cn } from "@/lib/utils";

const BASE_TEMPLATES: Record<string, string> = {
  signature: "SIGNATURE",
  ultra_wide: "ULTRA WIDE",
  simplicity: "SIMPLICITY",
  cinematic: "CINEMATIC",
  horizontal: "HORIZONTAL",
  vertical: "VERTICAL",
  digital_clock: "DIGITAL CLOCK",
  prayer_focus: "PRAYER FOCUS",
};

const POSITION_LABELS: Record<string, string> = { left: "Kiri", center: "Tengah", right: "Kanan", hidden: "Sembunyi", bottom: "Bawah" };
const BG_POSITIONS: Record<string, string> = { center: "Tengah", top: "Atas", bottom: "Bawah", left: "Kiri", right: "Kanan" };

export default function LayoutsPage() {
  const qc = useQueryClient();
  const now = useClock();
  const { data: display } = useQuery({ queryKey: ["display"], queryFn: () => apiGet<DisplayData>("/display"), refetchInterval: 60_000 });
  const { data: layouts } = useQuery({ queryKey: ["layouts"], queryFn: () => apiGet<Layout[]>("/layouts") });

  const [preview, setPreview] = useState<Layout | null>(null);
  const [custom, setCustom] = useState<Layout | null>(null);
  const [draft, setDraft] = useState<LayoutConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newLayout, setNewLayout] = useState({ name: "", base_key: "signature", description: "" });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["layouts"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const activate = useMutation({
    mutationFn: (id: string) => apiPost<Layout>(`/layouts/${id}/activate`),
    onSuccess: (l) => {
      invalidate();
      toast.success(`Layout ${l.name} diaktifkan`);
    },
    onError: () => toast.error("Gagal mengaktifkan layout"),
  });

  const saveConfig = useMutation({
    mutationFn: (l: Layout) => apiPut<Layout>(`/layouts/${l.id}`, { name: l.name, description: l.description, config: l.config }),
    onSuccess: (l) => {
      invalidate();
      setCustom(l);
      setDraft(l.config);
      toast.success("Perubahan layout tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan layout"),
  });

  const resetConfig = useMutation({
    mutationFn: (id: string) => apiPost<Layout>(`/layouts/${id}/reset`),
    onSuccess: (l) => {
      invalidate();
      setDraft(l.config);
      toast.success("Dikembalikan ke pengaturan default");
    },
    onError: () => toast.error("Gagal reset layout"),
  });

  const create = useMutation({
    mutationFn: (v: typeof newLayout) => apiPost<Layout>("/layouts", v),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      setNewLayout({ name: "", base_key: "signature", description: "" });
      toast.success("Layout baru dibuat — silakan kustomisasi");
    },
    onError: () => toast.error("Gagal membuat layout"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/layouts/${id}`),
    onSuccess: () => {
      invalidate();
      setCustom(null);
      setDraft(null);
      toast.success("Layout kustom dihapus");
    },
    onError: () => toast.error("Gagal menghapus layout"),
  });

  // Live-draft config: while customizing, edits apply instantly (live preview, no reload).
  const cfgFor = (l: Layout): LayoutConfig => (custom && custom.id === l.id && draft ? draft : l.config);

  return (
    <div>
      <PageHeader
        title="Layout Style"
        description="Katalog template tampilan TV. Klik 'Use This Layout' untuk mengaktifkan, atau kustomisasi warna, ukuran, dan posisi dengan live preview."
      >
        <Button data-testid="layouts-create-button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create New Layout
        </Button>
      </PageHeader>

      <div className="grid gap-8 sm:grid-cols-2 2xl:grid-cols-3">
        {(layouts ?? []).map((l) => (
          <Card key={l.id} className={cn("overflow-hidden", l.is_active && "border-primary")} data-testid={`layout-card-${l.id}`}>
            <div className="relative">
              <TvFrame>
                {display ? (
                  <LayoutEngine data={display} layout={l} config={cfgFor(l)} now={now} />
                ) : (
                  <div className="h-full w-full animate-pulse bg-secondary/40" />
                )}
              </TvFrame>
              {l.is_active && (
                <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground" data-testid={`layout-active-badge-${l.id}`}>
                  <Check className="size-3.5" /> ACTIVE
                </Badge>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-extrabold tracking-wide" data-testid={`layout-name-${l.id}`}>{l.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground" data-testid={`layout-description-${l.id}`}>{l.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" data-testid={`layout-preview-button-${l.id}`} onClick={() => setPreview(l)}>
                  <Eye className="size-4" /> Preview
                </Button>
                {l.is_active ? (
                  <Button size="sm" variant="secondary" disabled data-testid={`layout-use-button-${l.id}`}>
                    <Check className="size-4" /> Digunakan
                  </Button>
                ) : (
                  <Button size="sm" data-testid={`layout-use-button-${l.id}`} onClick={() => activate.mutate(l.id)} disabled={activate.isPending}>
                    Use This Layout
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`layout-customize-button-${l.id}`}
                  onClick={() => {
                    setCustom(l);
                    setDraft(l.config);
                  }}
                >
                  <Pencil className="size-4" /> Kustomisasi
                </Button>
                {l.is_custom && (
                  <Button size="sm" variant="destructive" data-testid={`layout-delete-button-${l.id}`} onClick={() => remove.mutate(l.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Customizer + LIVE PREVIEW (updates instantly, no reload, real mosque data) */}
      {custom && draft && (
        <div className="mt-10 rounded-2xl border border-primary/40 bg-card p-8" data-testid="layout-customizer">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold" data-testid="customizer-title">Kustomisasi — {custom.name}</h2>
              <p className="text-sm text-muted-foreground">Perubahan langsung terlihat di preview (live, tanpa reload).</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" data-testid="layout-reset-button" onClick={() => resetConfig.mutate(custom.id)} disabled={resetConfig.isPending}>
                <RotateCcw className="size-4" /> Reset to Default
              </Button>
              <Button data-testid="layout-save-button" onClick={() => saveConfig.mutate({ ...custom, config: draft })} disabled={saveConfig.isPending}>
                <Save className="size-4" /> Save Changes
              </Button>
              <Button variant="ghost" data-testid="layout-close-customizer-button" onClick={() => { setCustom(null); setDraft(null); }}>
                Tutup
              </Button>
            </div>
          </div>
          <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr]">
            <div>
              <TvFrame>
                {display ? <LayoutEngine data={display} layout={custom} config={draft} now={now} /> : null}
              </TvFrame>
              <p className="mt-2 text-xs text-muted-foreground" data-testid="customizer-live-preview-label">
                Live Preview — menggunakan data masjid sebenarnya.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary Color">
                <input type="color" data-testid="layout-config-primary_color" value={draft.primary_color} onChange={(e) => setDraft({ ...draft, primary_color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-secondary/40" />
              </Field>
              <Field label="Secondary Color">
                <input type="color" data-testid="layout-config-secondary_color" value={draft.secondary_color} onChange={(e) => setDraft({ ...draft, secondary_color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-secondary/40" />
              </Field>
              <Field label="Accent Color">
                <input type="color" data-testid="layout-config-accent_color" value={draft.accent_color} onChange={(e) => setDraft({ ...draft, accent_color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-secondary/40" />
              </Field>
              <Field label="Text Color">
                <input type="color" data-testid="layout-config-text_color" value={draft.text_color} onChange={(e) => setDraft({ ...draft, text_color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-secondary/40" />
              </Field>
              <Field label="Background Color">
                <input type="color" data-testid="layout-config-bg_color" value={draft.bg_color} onChange={(e) => setDraft({ ...draft, bg_color: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-secondary/40" />
              </Field>
              <Field label={`Panel Transparency (${Math.round(draft.panel_opacity * 100)}%)`}>
                <input type="range" min={0.3} max={1} step={0.05} data-testid="layout-config-panel_opacity" value={draft.panel_opacity} onChange={(e) => setDraft({ ...draft, panel_opacity: Number(e.target.value) })} className="mt-3 w-full accent-[#F59E0B]" />
              </Field>
              <Field label={`Font Size (${draft.font_size}%)`}>
                <input type="range" min={60} max={160} step={5} data-testid="layout-config-font_size" value={draft.font_size} onChange={(e) => setDraft({ ...draft, font_size: Number(e.target.value) })} className="mt-3 w-full accent-[#F59E0B]" />
              </Field>
              <Field label={`Clock Size (${draft.clock_size}%)`}>
                <input type="range" min={50} max={200} step={5} data-testid="layout-config-clock_size" value={draft.clock_size} onChange={(e) => setDraft({ ...draft, clock_size: Number(e.target.value) })} className="mt-3 w-full accent-[#F59E0B]" />
              </Field>
              <Field label="Logo Position">
                <Select value={draft.logo_position} onValueChange={(v) => setDraft({ ...draft, logo_position: v })}>
                  <SelectTrigger data-testid="layout-config-logo_position"><SelectValue>{POSITION_LABELS[draft.logo_position] ?? draft.logo_position}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITION_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mosque Name Position">
                <Select value={draft.mosque_name_position} onValueChange={(v) => setDraft({ ...draft, mosque_name_position: v })}>
                  <SelectTrigger data-testid="layout-config-mosque_name_position"><SelectValue>{POSITION_LABELS[draft.mosque_name_position]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {["left", "center", "right"].map((v) => (
                      <SelectItem key={v} value={v}>{POSITION_LABELS[v]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prayer Time Position">
                <Select value={draft.prayer_time_position} onValueChange={(v) => setDraft({ ...draft, prayer_time_position: v })}>
                  <SelectTrigger data-testid="layout-config-prayer_time_position"><SelectValue>{POSITION_LABELS[draft.prayer_time_position]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {["left", "right", "bottom"].map((v) => (
                      <SelectItem key={v} value={v}>{POSITION_LABELS[v]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Background Position">
                <Select value={draft.background_position} onValueChange={(v) => setDraft({ ...draft, background_position: v })}>
                  <SelectTrigger data-testid="layout-config-background_position"><SelectValue>{BG_POSITIONS[draft.background_position]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BG_POSITIONS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Running Text Speed (${draft.running_text_speed} detik/putaran)`}>
                <input type="range" min={10} max={90} step={5} data-testid="layout-config-running_text_speed" value={draft.running_text_speed} onChange={(e) => setDraft({ ...draft, running_text_speed: Number(e.target.value) })} className="mt-3 w-full accent-[#F59E0B]" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={preview !== null} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="max-w-4xl" data-testid="layout-preview-dialog">
          <DialogHeader>
            <DialogTitle data-testid="layout-preview-dialog-title">Preview — {preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && display && (
            <TvFrame>
              <LayoutEngine data={display} layout={preview} now={now} />
            </TvFrame>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Layout modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" data-testid="layout-create-dialog">
          <DialogHeader>
            <DialogTitle>Create New Layout</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Field label="Nama Layout">
              <TextInput data-testid="layout-create-name-input" value={newLayout.name} onChange={(e) => setNewLayout({ ...newLayout, name: e.target.value })} placeholder="cth: SIGNATURE EMAS" />
            </Field>
            <Field label="Template Dasar">
              <Select value={newLayout.base_key} onValueChange={(v) => setNewLayout({ ...newLayout, base_key: v })}>
                <SelectTrigger data-testid="layout-create-base-select">
                  <SelectValue>{BASE_TEMPLATES[newLayout.base_key]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BASE_TEMPLATES).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Deskripsi (opsional)">
              <TextAreaInput rows={2} data-testid="layout-create-description-input" value={newLayout.description} onChange={(e) => setNewLayout({ ...newLayout, description: e.target.value })} />
            </Field>
            <Button className="w-full" data-testid="layout-create-save-button" onClick={() => create.mutate(newLayout)} disabled={create.isPending || !newLayout.name.trim()}>
              Buat Layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
