import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import type { PrayerSettings, PrayerTimesOut } from "@/lib/types";
import { PRAYER_LABELS, PRAYER_ORDER } from "@/lib/display";
import { Field, PageHeader, TextInput, Toggle, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const METHODS: Record<string, string> = {
  KEMENAG: "Kemenag (Indonesia)",
  MWL: "Muslim World League",
  ISNA: "ISNA (Amerika Utara)",
  EGYPT: "Mesir (General Authority)",
  MAKKAH: "Umm al-Qura, Makkah",
  MANUAL: "Manual (isi sendiri)",
};
const ASR_METHODS: Record<string, string> = { STANDARD: "Syafi'i, Maliki, Hanbali", HANAFI: "Hanafi" };

export default function PrayerTimePage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<PrayerSettings>(["prayer-settings"], () => apiGet<PrayerSettings>("/prayer-settings"));
  const { data: preview } = useQuery({
    queryKey: ["prayer-times"],
    queryFn: () => apiGet<PrayerTimesOut>("/prayer-times"),
    refetchInterval: 60_000,
  });

  const save = useMutation({
    mutationFn: (v: PrayerSettings) => apiPut<PrayerSettings>("/prayer-settings", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["prayer-settings"] });
      qc.invalidateQueries({ queryKey: ["prayer-times"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan jadwal shalat tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan pengaturan"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;
  const isManual = form.method === "MANUAL";

  return (
    <div className="max-w-4xl">
      <PageHeader title="Prayer Time" description="Metode perhitungan otomatis dari koordinat masjid, koreksi waktu per shalat, atau isi manual." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
          <Field label="Metode Perhitungan">
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger data-testid="prayer-method-select">
                <SelectValue>{METHODS[form.method] ?? form.method}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHODS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mazhab Ashar">
            <Select value={form.asr_method} onValueChange={(v) => setForm({ ...form, asr_method: v })}>
              <SelectTrigger data-testid="prayer-asr-select">
                <SelectValue>{ASR_METHODS[form.asr_method] ?? form.asr_method}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASR_METHODS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Koreksi Waktu (menit, boleh minus)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRAYER_ORDER.map((k) => (
                <Field key={k} label={PRAYER_LABELS[k]}>
                  <TextInput
                    type="number"
                    data-testid={`prayer-correction-${k}`}
                    value={form.corrections[k] ?? 0}
                    onChange={(e) => setForm({ ...form, corrections: { ...form.corrections, [k]: Number(e.target.value) || 0 } })}
                  />
                </Field>
              ))}
            </div>
          </div>

          {isManual && (
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Jam Shalat Manual (HH:MM)</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRAYER_ORDER.map((k) => (
                  <Field key={k} label={PRAYER_LABELS[k]}>
                    <TextInput
                      type="time"
                      data-testid={`prayer-manual-${k}`}
                      value={form.manual_times[k] ?? ""}
                      onChange={(e) => setForm({ ...form, manual_times: { ...form.manual_times, [k]: e.target.value } })}
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}

          <Button data-testid="prayer-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
            <Save className="size-4" /> Simpan Pengaturan
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold" data-testid="prayer-preview-title">Hasol Hitung Hari Ini</h2>
            {preview && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary" data-testid="prayer-preview-source">
                {preview.source === "manual" ? "Manual" : "Otomatis"}
              </span>
            )}
          </div>
          {preview ? (
            <div className="space-y-2">
              {PRAYER_ORDER.map((k) => (
                <div key={k} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2" data-testid={`prayer-preview-${k}`}>
                  <span className="text-sm font-medium">{PRAYER_LABELS[k]}</span>
                  <span className="font-mono font-bold tabular-nums">{preview.times[k]}</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground" data-testid="prayer-preview-date">
                {preview.gregorian_formatted} • {preview.hijri.formatted}
              </p>
            </div>
          ) : (
            <div className="h-64 animate-pulse rounded-lg bg-secondary/40" />
          )}
          <div className="mt-6">
            <Toggle
              checked={isManual}
              onChange={(v) => setForm({ ...form, method: v ? "MANUAL" : "KEMENAG" })}
              label="Gunakan jam manual"
              testid="prayer-manual-toggle"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
