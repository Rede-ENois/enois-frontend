import { randomUUID } from "@/utils/uuid";

export function getFirstFile(
  event: React.ChangeEvent<HTMLInputElement>,
): File | null {
  return event.target.files?.[0] ?? null;
}

export function createObjectUrl(file: Blob): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function createMediaFileName(file: File): string {
  return `media/${randomUUID()}/${sanitizeFileName(file.name)}`;
}
