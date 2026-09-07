import type { MediaAsset } from "@/types/application/media/media-asset";
import type { MediaUploadResponse } from "@/types/application/media/media-upload-response";

import { apiRequest } from "@/lib/api-request";

export function requestUpload(
  data: Pick<MediaAsset, "fileName" | "mimeType" | "size" | "purpose">,
) {
  return apiRequest<MediaUploadResponse>("POST", "/media/uploads", data, { idempotent: true });
}
