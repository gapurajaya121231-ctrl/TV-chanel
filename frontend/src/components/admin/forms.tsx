// Shared admin building blocks: page header, labelled fields, toggle, doc-form hook.
import { useEffect, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className={cn("border-border bg-secondary/40", props.className)} />;
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Textarea {...props} className={cn("border-border bg-secondary/40", props.className)} />;
}

export function Toggle({ checked, onChange, label, testid }: { checked: boolean; onChange: (v: boolean) => void; label: string; testid: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium" data-testid={testid}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>{label}</span>
    </label>
  );
}

// Single-document form: seed state from the query once, keep edits across refetches.
export function useDocForm<T extends { id: string }>(key: string[], fetcher: () => Promise<T>) {
  const { data } = useQuery({ queryKey: key, queryFn: fetcher });
  const [form, setForm] = useState<T | null>(null);
  useEffect(() => {
    if (data) setForm((prev) => prev ?? data);
  }, [data]);
  return { form, setForm, data };
}
