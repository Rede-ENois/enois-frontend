import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";

import { uploadMediaFile } from "@/lib/media/upload-media-file";

export async function uploadMediaFiles(
  files: UploadInput[],
  onProgress?: (progress: number) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let index = 0; index < files.length; index++) {
    const { file, purpose = "POST_IMAGE" } = files[index];
    results.push(await uploadMediaFile(file, purpose));
    onProgress?.(Math.round(((index + 1) / files.length) * 100));
  }

  return results;
}
