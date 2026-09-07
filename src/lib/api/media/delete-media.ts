import type { MediaAsset } from "@/types/application/media/media-asset";

import { apiRequest } from "@/lib/api-request";

export function deleteMedia(mediaId: string) {
  return apiRequest<Pick<MediaAsset, "id" | "status">>("DELETE", `/media/${mediaId}`, null, {
    idempotent: true,
  });
}
