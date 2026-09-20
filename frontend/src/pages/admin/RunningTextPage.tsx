import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { RunningText, RunningTextCreate } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, Toggle } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPEEDS = [15, 30, 40, 60, 90];
const EMPTY: RunningTextCreate = { text: "", speed: 40, is_active: true };

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

  const toggleActive = useMutation({
    mutationFn: (t: RunningText) => apiPut<RunningText>(`/running-texts/${t.id}`, { text: t.text, speed: t.speed, is_active: !t.is_active }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader title="Running Text" description="Teks berjalan di bagian bawah layar TV. Kecepatan diatur per teks (detik per putaran).">
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
                <div className="truncate font-medium" data-testid={`running-text-${t.id}`}>{t.text}</div>
                <div className="text-xs text-muted-foreground" data-testid={`running-speed-${t.id}`}>Kecepatan: {t.speed} detik/putaran</div>
              </div>
              <Toggle checked={t.is_active} onChange={() => toggleActive.mutate(t)} label="Aktif" testid={`running-active-toggle-${t.id}`} />
              <Button size="icon-sm" variant="outline" data-testid={`running-edit-button-${t.id}`} onClick={() => {
                setEditingId(t.id);
                setDraft({ text: t.text, speed: t.speed, is_active: t.is_active });
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
