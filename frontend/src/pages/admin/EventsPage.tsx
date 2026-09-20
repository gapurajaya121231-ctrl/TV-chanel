import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { IslamicEvent, IslamicEventCreate } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, TextInput } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMPTY: IslamicEventCreate = { title: "", date: "", time: "", description: "" };

export default function EventsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IslamicEventCreate>(EMPTY);

  const { data: events } = useQuery({ queryKey: ["events"], queryFn: () => apiGet<IslamicEvent[]>("/events") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const save = useMutation({
    mutationFn: (v: IslamicEventCreate) =>
      editingId ? apiPut<IslamicEvent>(`/events/${editingId}`, v) : apiPost<IslamicEvent>("/events", v),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editingId ? "Kegiatan diperbarui" : "Kegiatan ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan kegiatan"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/events/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Kegiatan dihapus");
    },
  });

  return (
    <div>
      <PageHeader title="Islamic Event" description="Kegiatan Islam mendatang yang ditampilkan di layar TV: kajian, gotong royong, santunan, dan lainnya.">
        <Button
          data-testid="event-add-button"
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Kegiatan
        </Button>
      </PageHeader>

      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5" data-testid={`event-card-${e.id}`}>
              <div className="rounded-xl bg-primary/15 px-4 py-2 text-center font-mono text-sm font-bold text-primary" data-testid={`event-date-${e.id}`}>
                {e.date}
                {e.time ? `\n${e.time}` : ""}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold" data-testid={`event-title-${e.id}`}>{e.title}</div>
                <div className="truncate text-sm text-muted-foreground" data-testid={`event-description-${e.id}`}>{e.description}</div>
              </div>
              <Button size="icon-sm" variant="outline" data-testid={`event-edit-button-${e.id}`} onClick={() => {
                setEditingId(e.id);
                setDraft({ title: e.title, date: e.date, time: e.time, description: e.description });
                setOpen(true);
              }}>
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon-sm" variant="destructive" data-testid={`event-delete-button-${e.id}`} onClick={() => remove.mutate(e.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground" data-testid="event-empty">
          Belum ada kegiatan. Klik "Tambah Kegiatan" untuk membuat.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="event-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Field label="Judul">
              <TextInput data-testid="event-title-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal">
                <TextInput type="date" data-testid="event-date-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </Field>
              <Field label="Jam">
                <TextInput type="time" data-testid="event-time-input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              </Field>
            </div>
            <Field label="Deskripsi">
              <TextAreaInput rows={3} data-testid="event-description-input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Button className="w-full" data-testid="event-save-button" onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.title.trim() || !draft.date}>
              Simpan Kegiatan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
