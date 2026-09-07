import { useCallback, useState } from "react";

import { requestUpload } from "@/lib/api/media/request-upload";
import { uploadToImageKit } from "@/lib/api/media/upload-to-imagekit";
import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { UploadState } from "@/types/media-upload/upload-state";
import { randomUUID } from "@/utils/random-uuid";

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });

  const uploadFile = useCallback(
    async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
      const key = randomUUID();
      const fileName = `media/${key}/${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { id, cdnUrl } = await requestUpload({
        fileName,
        mimeType: file.type,
        size: file.size,
        purpose,
      });

      await uploadToImageKit(cdnUrl, file);
      return { mediaId: id, cdnUrl };
    },
    [],
  );

  const upload = useCallback(
    async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
      setState({ status: "uploading", progress: 0 });

      try {
        const result = await uploadFile(file, purpose);
        setState({ status: "done", progress: 100 });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload falhou";
        setState({ status: "error", progress: 0, error: message });
        throw error;
      }
    },
    [uploadFile],
  );

  const uploadAll = useCallback(
    async (files: UploadInput[]): Promise<UploadResult[]> => {
      if (files.length === 0) return [];
      setState({ status: "uploading", progress: 0 });

      const results: UploadResult[] = [];
      for (let index = 0; index < files.length; index++) {
        const { file, purpose = "POST_IMAGE" } = files[index];
        try {
          results.push(await uploadFile(file, purpose));
          setState((current) => ({
            ...current,
            progress: Math.round(((index + 1) / files.length) * 100),
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload falhou";
          setState({ status: "error", progress: 0, error: message });
          throw error;
        }
      }

      setState({ status: "done", progress: 100 });
      return results;
    },
    [uploadFile],
  );

  return { ...state, upload, uploadAll };
}
