import { useCallback, useState } from "react";

import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { UploadState } from "@/types/media-upload/upload-state";

import { uploadMediaFile } from "@/lib/media/upload-media-file";

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });

  const upload = useCallback(
    async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
      setState({ status: "uploading", progress: 0 });

      try {
        const result = await uploadMediaFile(file, purpose);
        setState({ status: "done", progress: 100 });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload falhou";
        setState({ status: "error", progress: 0, error: message });
        throw error;
      }
    },
    [],
  );

  const uploadAll = useCallback(async (files: UploadInput[]): Promise<UploadResult[]> => {
    if (files.length === 0) return [];
    setState({ status: "uploading", progress: 0 });

    const results: UploadResult[] = [];
    for (let index = 0; index < files.length; index++) {
      const { file, purpose = "POST_IMAGE" } = files[index];
      try {
        results.push(await uploadMediaFile(file, purpose));
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
  }, []);

  return { ...state, upload, uploadAll };
}
