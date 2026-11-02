import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { MediaItem } from "@/types/routes/feed/media-item";

/** Reuses images already checked at selection and uploads remaining files in their original order. */
export async function uploadComposerMedia(
  media: MediaItem[],
  uploadAll: (files: UploadInput[]) => Promise<UploadResult[]>,
): Promise<string[]> {
  const pending = media.filter((item) => !item.mediaId);
  const uploaded = pending.length ? await uploadAll(pending.map(({ file }) => ({ file }))) : [];
  if (uploaded.length !== pending.length) {
    throw new Error("O envio não retornou todos os arquivos selecionados.");
  }

  let nextUploaded = 0;
  return media.map((item) => {
    if (item.mediaId) return item.mediaId;
    const result = uploaded[nextUploaded++];
    if (!result) throw new Error("O envio não retornou todos os arquivos selecionados.");
    return result.mediaId;
  });
}
