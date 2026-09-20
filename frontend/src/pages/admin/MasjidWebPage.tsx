import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { MosqueProfile } from "@/lib/types";
import { Field, PageHeader, TextInput, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";

export default function MasjidWebPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<MosqueProfile>(["mosque"], () => apiGet<MosqueProfile>("/mosque"));

  const save = useMutation({
    mutationFn: (v: MosqueProfile) => apiPut<MosqueProfile>("/mosque", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["mosque"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("URL website masjid tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan URL"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Masjid Web" description="URL website resmi masjid — dapat ditampilkan pada materi promosi dan QR masjid." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <Field label="URL Website">
          <TextInput
            type="url"
            placeholder="https://masjidanda.id"
            data-testid="web-url-input"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </Field>
        {form.website && (
          <a
            href={form.website}
            target="_blank"
            rel="noreferrer"
            data-testid="web-open-link"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ExternalLink className="size-4" /> Buka {form.website}
          </a>
        )}
        <Button data-testid="web-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan
        </Button>
      </div>
    </div>
  );
}
