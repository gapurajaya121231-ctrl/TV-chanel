import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { uploadFile } from "@/lib/uploads";
import type { InfoSlide, InfoSlideCreate } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, TextInput, Toggle } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_LABELS: Record<string, string> = {
  pengumuman: "Pengumuman",
  kajian: "Jadwal Kajian",
  info: "Info",
  masjid: "Informasi Masjid",
};

const EMPTY: InfoSlideCreate = { slide_type: "pengumuman", title: "", body: "", image_url: "", is_active: true };

export default function InfoSlidePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<InfoSlideCreate>(EMPTY);

  const { data: slides } = useQuery({ queryKey: ["info-slides"], queryFn: () => apiGet<InfoSlide[]>("/info-slides") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["info-slides"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const save = useMutation({
    mutationFn: (v: InfoSlideCreate) =>
      editingId ? apiPut<InfoSlide>(`/info-slides/${editingId}`, v) : apiPost<InfoSlide>("/info-slides", v),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editingId ? "Slide diperbarui" : "Slide ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan slide"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/info-slides/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Slide dihapus");
    },
  });

  const openEdit = (s: InfoSlide) => {
    setEditingId(s.id);
    setDraft({ slide_type: s.slide_type, title: s.title, body: s.body, image_url: s.image_url, is_active: s.is_active });
    setOpen(true);
  };

  const toggleActive = useMutation({
    mutationFn: (s: InfoSlide) => apiPut<InfoSlide>(`/info-slides/${s.id}`, { slide_type: s.slide_type, title: s.title, body: s.body, image_url: s.image_url, is_active: !s.is_active }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <PageHeader title="Info Slide" description="Pengumuman, jadwal kajian, dan informasi masjid yang tampil bergantian di layar TV.">
        <Button
          data-testid="info-add-button"
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Slide
        </Button>
      </PageHeader>

      {slides && slides.length > 0 ? (
        <div className="space-y-4">
          {slides.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5" data-testid={`info-card-${s.id}`}>
              <Badge variant="outline" className="border-primary/50 text-primary" data-testid={`info-type-${s.id}`}>
                {TYPE_LABELS[s.slide_type] ?? s.slide_type}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold" data-testid={`info-title-${s.id}`}>{s.title}</div>
                <div className="truncate text-sm text-muted-foreground" data-testid={`info-body-${s.id}`}>{s.body}</div>
              </div>
              <Toggle checked={s.is_active} onChange={() => toggleActive.mutate(s)} label="Aktif" testid={`info-active-toggle-${s.id}`} />
              <Button size="icon-sm" variant="outline" data-testid={`info-edit-button-${s.id}`} onClick={() => openEdit(s)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button size="icon-sm" variant="destructive" data-testid={`info-delete-button-${s.id}`} onClick={() => remove.mutate(s.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground" data-testid="info-empty">
          Belum ada info slide. Klik "Tambah Slide" untuk membuat.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="info-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Slide" : "Tambah Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <Field label="Jenis Slide">
              <Select value={draft.slide_type} onValueChange={(v) => setDraft({ ...draft, slide_type: v })}>
                <SelectTrigger data-testid="info-type-select">
                  <SelectValue>{TYPE_LABELS[draft.slide_type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Judul">
              <TextInput data-testid="info-title-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Isi">
              <TextAreaInput rows={4} data-testid="info-body-input" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </Field>
            <Field label="Gambar (opsional)">
              <input
                type="file"
                accept="image/*"
                data-testid="info-image-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadFile(file);
                    setDraft({ ...draft, image_url: url });
                    toast.success("Gambar terunggah");
                  } catch {
                    toast.error("Gagal mengunggah gambar");
                  }
                }}
                className="w-full cursor-pointer rounded-lg border border-border bg-secondary/40 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              />
              {draft.image_url && <img src={draft.image_url} alt="Pratinjau" className="mt-3 h-24 w-full rounded-lg object-cover" data-testid="info-image-preview" />}
            </Field>
            <Toggle checked={draft.is_active ?? true} onChange={(v) => setDraft({ ...draft, is_active: v })} label="Slide aktif" testid="info-active-input" />
            <Button className="w-full" data-testid="info-save-button" onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.title.trim()}>
              Simpan Slide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
