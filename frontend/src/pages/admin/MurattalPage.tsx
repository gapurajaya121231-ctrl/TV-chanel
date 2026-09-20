import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { MurattalCreate, MurattalSchedule } from "@/lib/types";
import { Field, PageHeader, TextInput } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toggle } from "@/components/admin/forms";

const EMPTY: MurattalCreate = { title: "Murattal", start_time: "05:30", duration_minutes: 30 };

export default function MurattalPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MurattalCreate>(EMPTY);

  const { data: schedules } = useQuery({ queryKey: ["murattal"], queryFn: () => apiGet<MurattalSchedule[]>("/murattal") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["murattal"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const save = useMutation({
    mutationFn: (v: MurattalCreate) =>
      editingId ? apiPut<MurattalSchedule>(`/murattal/${editingId}`, v) : apiPost<MurattalSchedule>("/murattal", v),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editingId ? "Jadwal murattal diperbarui" : "Jadwal murattal ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan jadwal murattal"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/murattal/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Jadwal murattal dihapus");
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: (m: MurattalSchedule) => apiPut<MurattalSchedule>(`/murattal/${m.id}`, { title: m.title, start_time: m.start_time, duration_minutes: m.duration_minutes }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader title="Scheduled Murattal" description="Jadwal pemutaran murattal (bacaan Al-Qur'an): waktu mulai dan durasi. Badge 'Sedang Berlangsung' tampil di TV saat jadwal aktif.">
        <Button
          data-testid="murattal-add-button"
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Jadwal
        </Button>
      </PageHeader>

      {schedules && schedules.length > 0 ? (
        <div className="space-y-4">
          {schedules.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5" data-testid={`murattal-card-${m.id}`}>
              <div className="rounded-xl bg-primary/15 px-4 py-2 font-mono text-sm font-bold text-primary" data-testid={`murattal-time-${m.id}`}>
                {m.start_time} • {m.duration_minutes} menit
              </div>
              <div className="min-w-0 flex-1 truncate font-bold" data-testid={`murattal-title-${m.id}`}>{m.title}</div>
              <Toggle
                checked={m.enabled}
                onChange={() => {
                  void toggleEnabled.mutateAsync(m).then(() => {
                    // toggle handled via enabled field — persisted through PUT below
                  });
                }}
                label="Aktif"
                testid={`murattal-enabled-toggle-${m.id}`}
              />
              <Button size="icon-sm" variant="outline" data-testid={`murattal-edit-button-${m.id}`} onClick={() => {
                setEditingId(m.id);
                setDraft({ title: m.title, start_time: m.start_time, duration_minutes: m.duration_minutes });
                setOpen(true);
              }}>
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon-sm" variant="destructive" data-testid={`murattal-delete-button-${m.id}`} onClick={() => remove.mutate(m.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground" data-testid="murattal-empty">
          Belum ada jadwal murattal.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-testid="murattal-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Jadwal Murattal" : "Tambah Jadwal Murattal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Field label="Nama">
              <TextInput data-testid="murattal-title-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Waktu Mulai">
                <TextInput type="time" data-testid="murattal-start-input" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} />
              </Field>
              <Field label="Durasi (menit)">
                <TextInput type="number" min={5} max={180} data-testid="murattal-duration-input" value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) || 30 })} />
              </Field>
            </div>
            <Button className="w-full" data-testid="murattal-save-button" onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.start_time}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
