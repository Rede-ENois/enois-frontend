import { extractVideoId } from "@/utils/extract-video-id";
import { getLinkMetadata } from "@/utils/get-link-metadata";

export function createLinkPreviewsViewModel(content: string) {
  const urls = content.match(/https?:\/\/[^\s]+/g) ?? [];
  const uniqueUrls = [...new Set(urls)];

  return uniqueUrls.map((url) => {
    const video = extractVideoId(url);
    if (video) {
      return {
        kind: "video" as const,
        key: url,
        type: video.type,
        id: video.id,
      };
    }

    const link = getLinkMetadata(url);
    return {
      kind: "link" as const,
      key: url,
      url,
      initials: link.initials,
      hostname: link.hostname,
    };
  });
}
