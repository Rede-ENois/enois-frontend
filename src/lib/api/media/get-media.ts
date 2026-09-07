import type { MediaAsset } from "@/types/application/media/media-asset";

import { apiRequest } from "@/lib/api-request";

export function getMedia(mediaId: string) {
  return apiRequest<MediaAsset>("GET", `/media/${mediaId}`);
}
