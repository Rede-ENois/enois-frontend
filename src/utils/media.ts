import type { LocalMediaItem } from "@/types/components/feed/local-media-item";
import type { LocalMediaType } from "@/types/components/feed/local-media-type";
import type { MediaRule } from "@/types/components/feed/media-rule";

const mediaRules: Record<LocalMediaType, MediaRule> = {
  image: { maxItems: 4, incompatibleWith: ["video"] },
  video: { maxItems: 1, incompatibleWith: ["image", "video"] },
};

const mimePrefixes: Record<LocalMediaType, string> = {
  image: "image/",
  video: "video/",
};

export function getLocalMediaType(file: File): LocalMediaType | null {
  return (Object.entries(mimePrefixes) as [LocalMediaType, string][]).find(([, prefix]) =>
    file.type.startsWith(prefix),
  )?.[0] ?? null;
}

export function appendLocalMedia(
  current: LocalMediaItem[],
  files: FileList | File[],
): LocalMediaItem[] {
  const next = [...current];

  for (const file of Array.from(files)) {
    const type = getLocalMediaType(file);
    if (!type) continue;

    const rule = mediaRules[type];
    const hasIncompatibleMedia = next.some((item) => rule.incompatibleWith.includes(item.type));
    if (hasIncompatibleMedia || next.length >= rule.maxItems) break;

    next.push({
      type,
      file,
      preview: URL.createObjectURL(file),
    });
  }

  return next;
}

export function removeLocalMedia(items: LocalMediaItem[], index: number): LocalMediaItem[] {
  const item = items[index];
  if (item) URL.revokeObjectURL(item.preview);
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function getLocalMediaTypeFromItems(items: LocalMediaItem[]): LocalMediaType | null {
  return items[0]?.type ?? null;
}
