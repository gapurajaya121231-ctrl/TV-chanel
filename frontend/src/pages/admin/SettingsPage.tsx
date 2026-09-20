import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { GeneralSettings } from "@/lib/types";
import { Field, PageHeader, Toggle, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<GeneralSettings>(["settings"], () => apiGet<GeneralSettings>("/settings"));

  const save = useMutation({
    mutationFn: (v: GeneralSettings) => apiPut<GeneralSettings>("/settings", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan umum tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan pengaturan"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Pengaturan umum tampilan TV: slideshow, imsak, tanggal Hijriah, dan running text." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="space-y-4">
          <Toggle checked={form.slideshow_enabled} onChange={(v) => setForm({ ...form, slideshow_enabled: v })} label="Slideshow foto masjid aktif" testid="settings-slideshow-toggle" />
          <Toggle checked={form.show_imsak} onChange={(v) => setForm({ ...form, show_imsak: v })} label="Tampilkan waktu Imsak" testid="settings-imsak-toggle" />
          <Toggle checked={form.show_hijri} onChange={(v) => setForm({ ...form, show_hijri: v })} label="Tampilkan tanggal Hijriah" testid="settings-hijri-toggle" />
          <Toggle checked={form.show_running_text} onChange={(v) => setForm({ ...form, show_running_text: v })} label="Tampilkan running text" testid="settings-running-toggle" />
        </div>
        <Field label="Interval Slideshow (detik)">
          <Select value={String(form.slideshow_interval)} onValueChange={(v) => setForm({ ...form, slideshow_interval: Number(v) })}>
            <SelectTrigger data-testid="settings-interval-select" className="w-40">
              <SelectValue>{form.slideshow_interval} detik</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 60].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} detik</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button data-testid="settings-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
