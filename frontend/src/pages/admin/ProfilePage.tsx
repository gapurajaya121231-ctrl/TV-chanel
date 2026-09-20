import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { uploadFile } from "@/lib/uploads";
import type { MosqueProfile } from "@/lib/types";
import { Field, PageHeader, TextInput, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<MosqueProfile>(["mosque"], () => apiGet<MosqueProfile>("/mosque"));

  const save = useMutation({
    mutationFn: (v: MosqueProfile) => apiPut<MosqueProfile>("/mosque", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["mosque"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Profil masjid tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan profil"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  const upload = async (file: File | undefined, target: "logo_url" | "photo_url") => {
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm({ ...form, [target]: url });
      toast.success("Foto terunggah — klik Simpan untuk menerapkan");
    } catch {
      toast.error("Gagal mengunggah file");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Masjid Profile" description="Identitas masjid yang tampil di layar TV: nama, alamat, logo, dan foto." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <Field label="Nama Masjid">
          <TextInput data-testid="profile-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Alamat">
          <TextInput data-testid="profile-address-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Telepon (opsional)">
          <TextInput data-testid="profile-phone-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Logo Masjid">
            <input
              type="file"
              accept="image/*"
              data-testid="profile-logo-input"
              onChange={(e) => upload(e.target.files?.[0], "logo_url")}
              className="w-full cursor-pointer rounded-lg border border-border bg-secondary/40 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
            />
            {form.logo_url && <img src={form.logo_url} alt="Logo" className="mt-3 h-16 w-16 rounded-full bg-white object-contain p-1" data-testid="profile-logo-preview" />}
          </Field>
          <Field label="Foto Masjid (utama)">
            <input
              type="file"
              accept="image/*"
              data-testid="profile-photo-input"
              onChange={(e) => upload(e.target.files?.[0], "photo_url")}
              className="w-full cursor-pointer rounded-lg border border-border bg-secondary/40 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
            />
            {form.photo_url && <img src={form.photo_url} alt="Masjid" className="mt-3 h-24 w-full rounded-lg object-cover" data-testid="profile-photo-preview" />}
          </Field>
        </div>
        <Button data-testid="profile-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan Profil
        </Button>
      </div>
    </div>
  );
}
