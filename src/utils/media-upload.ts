import { mediaApi } from "@/lib/api/media";
import { createMediaFileName } from "@/utils/files";

export async function uploadMediaFile(file: File, purpose = "POST_IMAGE") {
  const { id, cdnUrl } = await mediaApi.requestUpload({
    fileName: createMediaFileName(file),
    mimeType: file.type,
    size: file.size,
    purpose,
  });

  await mediaApi.uploadToImageKit(cdnUrl, file);
  return { mediaId: id, cdnUrl };
}
