import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { IqamahSettings } from "@/lib/types";
import { AZAN_ORDER, PRAYER_LABELS } from "@/lib/display";
import { Field, PageHeader, TextInput, Toggle, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";

export default function IqamahPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<IqamahSettings>(["iqamah"], () => apiGet<IqamahSettings>("/iqamah-settings"));

  const save = useMutation({
    mutationFn: (v: IqamahSettings) => apiPut<IqamahSettings>("/iqamah-settings", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["iqamah"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan iqamah tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan pengaturan iqamah"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Iqamah Screen" description="Jeda azan → iqamah per waktu shalat (menit). Countdown iqamah berjalan otomatis setelah layar azan." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Aktifkan countdown iqamah" testid="iqamah-enabled-toggle" />
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Jeda per waktu shalat (menit setelah azan)</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {AZAN_ORDER.map((k) => (
              <Field key={k} label={PRAYER_LABELS[k]}>
                <TextInput
                  type="number"
                  min={1}
                  max={60}
                  data-testid={`iqamah-offset-${k}`}
                  value={form.offsets[k] ?? 10}
                  onChange={(e) => setForm({ ...form, offsets: { ...form.offsets, [k]: Number(e.target.value) || 1 } })}
                />
              </Field>
            ))}
          </div>
        </div>
        <Field label="Pesan Iqamah">
          <TextInput data-testid="iqamah-message-input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <Button data-testid="iqamah-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan
        </Button>
      </div>
    </div>
  );
}
