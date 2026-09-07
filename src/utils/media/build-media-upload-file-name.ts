import { randomUUID } from "@/utils/random-uuid";

export function buildMediaUploadFileName(fileName: string) {
  const key = randomUUID();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `media/${key}/${safeFileName}`;
}
