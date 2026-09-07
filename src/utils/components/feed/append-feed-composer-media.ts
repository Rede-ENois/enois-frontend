import type { MediaItem } from "@/types/components/feed/media-item";

export function appendFeedComposerMedia(current: MediaItem[], files: File[]) {
  const next = [...current];

  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) continue;

    const hasImages = next.some((item) => item.type === "image");
    const hasVideo = next.some((item) => item.type === "video");

    if (isVideo && (hasImages || hasVideo || next.length >= 1)) break;
    if (isImage && hasVideo) break;
    if (isImage && next.length >= 4) break;

    next.push({
      type: isVideo ? "video" : "image",
      file,
      preview: URL.createObjectURL(file),
    });
  }

  return next;
}
