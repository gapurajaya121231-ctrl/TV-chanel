import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { MosqueProfile } from "@/lib/types";
import { TIMEZONES } from "@/lib/display";
import { Field, PageHeader, TextInput, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LocalizationPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<MosqueProfile>(["mosque"], () => apiGet<MosqueProfile>("/mosque"));

  const save = useMutation({
    mutationFn: (v: MosqueProfile) => apiPut<MosqueProfile>("/mosque", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["mosque"] });
      qc.invalidateQueries({ queryKey: ["prayer-times"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Lokasi masjid tersimpan — jadwal shalat dihitung ulang");
    },
    onError: () => toast.error("Gagal menyimpan lokasi"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Localization" description="Lokasi masjid menentukan perhitungan jadwal shalat, zona waktu jam TV, dan tanggal Hijriah." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Negara">
            <TextInput data-testid="localization-country-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
          <Field label="Provinsi">
            <TextInput data-testid="localization-province-input" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
          </Field>
          <Field label="Kota">
            <TextInput data-testid="localization-city-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Latitude (derajat desimal)">
            <TextInput type="number" step="any" data-testid="localization-latitude-input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Longitude (derajat desimal)">
            <TextInput type="number" step="any" data-testid="localization-longitude-input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) || 0 })} />
          </Field>
        </div>
        <Field label="Timezone">
          <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
            <SelectTrigger data-testid="localization-timezone-select">
              <SelectValue>{form.timezone}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button data-testid="localization-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan Lokasi
        </Button>
      </div>
    </div>
  );
}
