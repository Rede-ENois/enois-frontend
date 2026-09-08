import type { UploadResult } from "@/types/media-upload/upload-result";
import { buildMediaUploadFileName } from "@/utils/media/build-media-upload-file-name";

import { requestUpload } from "@/lib/api/media/request-upload";
import { uploadToImageKit } from "@/lib/api/media/upload-to-imagekit";

export async function uploadMediaFile(file: File, purpose = "POST_IMAGE"): Promise<UploadResult> {
  const fileName = buildMediaUploadFileName(file.name);
  const { id, cdnUrl } = await requestUpload({
    fileName,
    mimeType: file.type,
    size: file.size,
    purpose,
  });

  await uploadToImageKit(cdnUrl, file);
  return { mediaId: id, cdnUrl };
}
