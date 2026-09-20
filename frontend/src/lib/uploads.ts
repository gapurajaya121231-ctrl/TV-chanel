// Multipart upload — separate from the JSON helpers in api.ts (different content type).
import { ApiError } from "./api";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
