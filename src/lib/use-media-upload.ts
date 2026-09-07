import { useCallback, useState } from "react";

import type { UploadInput } from "@/types/media-upload/upload-input";
import type { UploadResult } from "@/types/media-upload/upload-result";
import type { UploadState } from "@/types/media-upload/upload-state";

import { uploadMediaFiles } from "@/lib/media/upload-media-files";

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });

  const runUpload = useCallback(async (files: UploadInput[]): Promise<UploadResult[]> => {
    if (files.length === 0) return [];
    setState({ status: "uploading", progress: 0 });

    try {
      const results = await uploadMediaFiles(files, (progress) => {
        setState((current) => ({ ...current, progress }));
      });
      setState({ status: "done", progress: 100 });
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload falhou";
      setState({ status: "error", progress: 0, error: message });
      throw error;
    }
  }, []);

  const upload = useCallback(
    async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
      const [result] = await runUpload([{ file, purpose }]);
      if (!result) throw new Error("Upload falhou");
      return result;
    },
    [runUpload],
  );

  return { ...state, upload, uploadAll: runUpload };
}
