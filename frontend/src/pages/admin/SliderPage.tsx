import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Trash2, Upload } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { uploadFile } from "@/lib/uploads";
import type { GeneralSettings, SliderImage } from "@/lib/types";
import { Field, PageHeader } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/admin/forms";

export default function SliderPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: images } = useQuery({ queryKey: ["slider"], queryFn: () => apiGet<SliderImage[]>("/slider") });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<GeneralSettings>("/settings") });
  const [interval, setInterval] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["slider"] });
    qc.invalidateQueries({ queryKey: ["display"] });
  };

  const addImages = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        await apiPost<SliderImage>("/slider", { url, title: file.name.replace(/\.[^.]+$/, "") });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Foto ditambahkan ke slider");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: () => toast.error("Gagal mengunggah foto"),
    onSettled: () => setUploading(false),
  });

  const setUtama = useMutation({
    mutationFn: (id: string) => apiPatch<SliderImage>(`/slider/${id}`, { is_utama: true }),
    onSuccess: () => {
      invalidate();
      toast.success("Foto utama diatur");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/slider/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Foto dihapus");
    },
  });

  const saveSettings = useMutation({
    mutationFn: (v: GeneralSettings) => apiPut<GeneralSettings>("/settings", v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan slideshow tersimpan");
    },
  });

  const currentInterval = interval ?? settings?.slideshow_interval ?? 20;

  return (
    <div>
      <PageHeader title="Main Slider" description="Foto masjid untuk background dan slideshow TV. Foto pertama/utama tampil lebih dulu." />

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          data-testid="slider-upload-input"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              setUploading(true);
              addImages.mutate(files);
            }
          }}
          className="hidden"
        />
        <Button data-testid="slider-upload-button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="size-4" /> {uploading ? "Mengunggah…" : "Upload Foto"}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-6">
          <Toggle
            checked={settings?.slideshow_enabled ?? true}
            onChange={(v) => settings && saveSettings.mutate({ ...settings, slideshow_enabled: v })}
            label="Slideshow ON"
            testid="slider-slideshow-toggle"
          />
          <Field label="Interval Slideshow">
            <Select value={String(currentInterval)} onValueChange={(v) => setInterval(Number(v))}>
              <SelectTrigger data-testid="slider-interval-select" className="w-32">
                <SelectValue>{currentInterval} detik</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 60].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} detik</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {settings && interval !== null && interval !== settings.slideshow_interval && (
            <Button data-testid="slider-interval-save-button" onClick={() => saveSettings.mutate({ ...settings, slideshow_interval: interval })}>
              Simpan Interval
            </Button>
          )}
        </div>
      </div>

      {images && images.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden" data-testid={`slider-card-${img.id}`}>
              <div className="relative aspect-video">
                <img src={img.url} alt={img.title || "Foto masjid"} className="h-full w-full object-cover" />
                {img.is_utama && (
                  <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground" data-testid={`slider-utama-badge-${img.id}`}>
                    <Star className="size-3" /> Utama
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-sm font-medium" data-testid={`slider-title-${img.id}`}>{img.title || "Tanpa judul"}</span>
                <div className="flex shrink-0 gap-2">
                  {!img.is_utama && (
                    <Button size="icon-xs" variant="outline" data-testid={`slider-utama-button-${img.id}`} onClick={() => setUtama.mutate(img.id)} title="Jadikan foto utama">
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button size="icon-xs" variant="destructive" data-testid={`slider-delete-button-${img.id}`} onClick={() => remove.mutate(img.id)} title="Hapus foto">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground" data-testid="slider-empty">
          Belum ada foto. Klik "Upload Foto" untuk menambahkan foto masjid.
        </div>
      )}
    </div>
  );
}
