import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { AzanSettings } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, TextInput, Toggle, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";

export default function AzanPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<AzanSettings>(["azan"], () => apiGet<AzanSettings>("/azan-settings"));

  const save = useMutation({
    mutationFn: (v: AzanSettings) => apiPut<AzanSettings>("/azan-settings", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["azan"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan azan tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan pengaturan azan"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Azan Screen" description="Tampilan layar penuh ketika waktu azan masuk: pesan azan dan countdown menjelang iqamah." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Aktifkan layar azan" testid="azan-enabled-toggle" />
        <Field label="Pesan Azan">
          <TextAreaInput rows={3} data-testid="azan-message-input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </Field>
        <Field label="Durasi layar azan (menit)">
          <TextInput
            type="number"
            min={1}
            max={30}
            data-testid="azan-duration-input"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 1 })}
          />
        </Field>
        <Toggle checked={form.show_countdown} onChange={(v) => setForm({ ...form, show_countdown: v })} label="Tampilkan countdown iqamah di layar azan" testid="azan-countdown-toggle" />
        <Button data-testid="azan-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan
        </Button>
      </div>
    </div>
  );
}
