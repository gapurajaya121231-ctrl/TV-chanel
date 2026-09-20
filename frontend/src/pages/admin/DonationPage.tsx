import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { uploadFile } from "@/lib/uploads";
import type { DonationSlide } from "@/lib/types";
import { Field, PageHeader, TextAreaInput, TextInput, Toggle, useDocForm } from "@/components/admin/forms";
import { Button } from "@/components/ui/button";

export default function DonationPage() {
  const qc = useQueryClient();
  const { form, setForm } = useDocForm<DonationSlide>(["donation"], () => apiGet<DonationSlide>("/donation"));

  const save = useMutation({
    mutationFn: (v: DonationSlide) => apiPut<DonationSlide>("/donation", v),
    onSuccess: (saved) => {
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["donation"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Slide donasi tersimpan");
    },
    onError: () => toast.error("Gagal menyimpan slide donasi"),
  });

  if (!form) return <p className="text-muted-foreground">Memuat…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Donation Slide" description="Informasi infak/sedekah: QR Code, rekening, dan teks donasi yang tampil di layar TV." />
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <Field label="Judul">
          <TextInput data-testid="donation-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Teks Donasi">
          <TextAreaInput rows={3} data-testid="donation-text-input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </Field>
        <Field label="QR Code (gambar)">
          <input
            type="file"
            accept="image/*"
            data-testid="donation-qr-input"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await uploadFile(file);
                setForm({ ...form, qr_url: url });
                toast.success("QR terunggah");
              } catch {
                toast.error("Gagal mengunggah QR");
              }
            }}
            className="w-full cursor-pointer rounded-lg border border-border bg-secondary/40 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
          />
          {form.qr_url && <img src={form.qr_url} alt="QR Donasi" className="mt-3 h-32 w-32 rounded-lg bg-white object-contain p-2" data-testid="donation-qr-preview" />}
        </Field>
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Bank">
            <TextInput data-testid="donation-bank-input" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
          </Field>
          <Field label="Nomor Rekening">
            <TextInput data-testid="donation-account-input" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
          </Field>
          <Field label="Atas Nama">
            <TextInput data-testid="donation-account-name-input" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          </Field>
        </div>
        <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Tampilkan slide donasi di TV" testid="donation-active-toggle" />
        <Button data-testid="donation-save-button" onClick={() => save.mutate(form)} disabled={save.isPending}>
          <Save className="size-4" /> Simpan
        </Button>
      </div>
    </div>
  );
}
