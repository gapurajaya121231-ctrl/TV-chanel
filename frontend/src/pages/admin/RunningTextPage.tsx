import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Pencil, Plus, Trash2, Type } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { RunningText, RunningTextCreate } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, Toggle } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPEEDS = [15, 30, 40, 60, 90];
const SIZE_PRESETS = [
  { label: "Kecil", value: 75 },
  { label: "Sedang", value: 100 },
  { label: "Besar", value: 140 },
  { label: "Sangat Besar", value: 180 },
];
const EMPTY: RunningTextCreate = { text: "", speed: 40, size: 100, is_active: true };

const clampSize = (n: number) => Math.max(60, Math.min(200, n));

export default function RunningTextPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RunningTextCreate>(EMPTY);

  const { data: texts } = useQuery({ queryKey: ["running-texts"], queryFn: () => apiGet<RunningText[]>("/running-texts") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["running-texts"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const save = useMutation({
    mutationFn: (v: RunningTextCreate) =>
      editingId ? apiPut<RunningText>(`/running-texts/${editingId}`, v) : apiPost<RunningText>("/running-texts", v),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editingId ? "Running text diperbarui" : "Running text ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan running text"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/running-texts/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Running text dihapus");
    },
  });

  const patch = useMutation({
    mutationFn: (t: RunningText) =>
      apiPut<RunningText>(`/running-texts/${t.id}`, { text: t.text, speed: t.speed, size: t.size, is_active: t.is_active }),
    onSuccess: invalidate,
    onError: () => toast.error("Gagal memperbarui running text"),
  });

  // Quick +/- resize straight from the list — applies to how the text shows on the TV.
  const nudgeSize = (t: RunningText, delta: number) =>
    patch.mutate({ ...t, size: clampSize((t.size || 100) + delta) });

  const draftSize = draft.size ?? 100;

  return (
    <div>
      <PageHeader title="Running Text" description="Teks berjalan di bagian bawah layar TV. Atur kecepatan dan ukuran tampil (perbesar/perkecil) untuk setiap teks.">
        <Button
          data-testid="running-add-button"
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Running Text
        </Button>
      </PageHeader>

      {texts && texts.length > 0 ? (
        <div className="space-y-4">
          {texts.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5" data-testid={`running-card-${t.id}`}>
              <div className="min-w-0 flex-1">
                {/* Preview scales exactly like the TV bar does */}
                <div
                  className="truncate font-medium"
                  style={{ fontSize: `${(0.95 * clampSize(t.size || 100)) / 100}rem` }}
                  data-testid={`running-text-${t.id}`}
                >
                  {t.text}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span data-testid={`running-speed-${t.id}`}>Kecepatan: {t.speed} detik/putaran</span>
                  <Badge variant="outline" className="border-primary/50 text-primary" data-testid={`running-size-${t.id}`}>
                    <Type className="size-3" /> Ukuran {clampSize(t.size || 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  title="Perkecil ukuran teks"
                  data-testid={`running-size-down-${t.id}`}
                  onClick={() => nudgeSize(t, -20)}
                  disabled={clampSize(t.size || 100) <= 60 || patch.isPending}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  title="Perbesar ukuran teks"
                  data-testid={`running-size-up-${t.id}`}
                  onClick={() => nudgeSize(t, 20)}
                  disabled={clampSize(t.size || 100) >= 200 || patch.isPending}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <Toggle checked={t.is_active} onChange={(v) => patch.mutate({ ...t, is_active: v })} label="Aktif" testid={`running-active-toggle-${t.id}`} />
              <Button size="icon-sm" variant="outline" data-testid={`running-edit-button-${t.id}`} onClick={() => {
                setEditingId(t.id);
                setDraft({ text: t.text, speed: t.speed, size: clampSize(t.size || 100), is_active: t.is_active });
                setOpen(true);
              }}>
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon-sm" variant="destructive" data-testid={`running-delete-button-${t.id}`} onClick={() => remove.mutate(t.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground" data-testid="running-empty">
          Belum ada running text.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="running-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Running Text" : "Tambah Running Text"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Field label="Teks">
              <TextAreaInput rows={3} data-testid="running-text-input" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
            </Field>
            <Field label="Kecepatan (detik per putaran — makin besar makin lambat)">
              <Select value={String(draft.speed)} onValueChange={(v) => setDraft({ ...draft, speed: Number(v) })}>
                <SelectTrigger data-testid="running-speed-select">
                  <SelectValue>{draft.speed} detik</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s} detik</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={`Ukuran Tampil di Layar (${draftSize}%)`}>
              <div className="mb-3 flex flex-wrap gap-2">
                {SIZE_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    size="xs"
                    variant={draftSize === p.value ? "default" : "outline"}
                    data-testid={`running-size-preset-${p.value}`}
                    onClick={() => setDraft({ ...draft, size: p.value })}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <input
                type="range"
                min={60}
                max={200}
                step={10}
                data-testid="running-size-slider"
                value={draftSize}
                onChange={(e) => setDraft({ ...draft, size: clampSize(Number(e.target.value)) })}
                className="w-full accent-[#F59E0B]"
              />
              <div className="mt-3 overflow-hidden rounded-lg bg-[#061325] px-4 py-3">
                <span
                  className="block truncate font-medium text-white"
                  style={{ fontSize: `${(0.95 * draftSize) / 100}rem` }}
                  data-testid="running-size-preview"
                >
                  {draft.text || "Contoh tampilan running text di layar TV"}
                </span>
              </div>
            </Field>
            <Toggle checked={draft.is_active ?? true} onChange={(v) => setDraft({ ...draft, is_active: v })} label="Aktif" testid="running-active-input" />
            <Button className="w-full" data-testid="running-save-button" onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.text.trim()}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
