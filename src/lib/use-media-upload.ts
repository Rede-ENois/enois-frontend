import { useCallback, useState } from "react";

import type { UploadResult } from "@/types/application/media/media-upload-response";
import { uploadMediaFile } from "@/utils/media-upload";

export type { UploadResult } from "@/types/application/media/media-upload-response";

export interface UploadState {
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

const initialState: UploadState = { status: "idle", progress: 0 };

function getUploadError(error: unknown): string {
  return error instanceof Error ? error.message : "Upload falhou";
}

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>(initialState);

  const upload = useCallback(async (file: File, purpose = "POST_IMAGE"): Promise<UploadResult> => {
    setState({ status: "uploading", progress: 0 });

    try {
      const result = await uploadMediaFile(file, purpose);
      setState({ status: "done", progress: 100 });
      return result;
    } catch (error) {
      setState({ status: "error", progress: 0, error: getUploadError(error) });
      throw error;
    }
  }, []);

  const uploadAll = useCallback(
    async (files: { file: File; purpose?: string }[]): Promise<UploadResult[]> => {
      if (files.length === 0) return [];

      setState({ status: "uploading", progress: 0 });
      const results: UploadResult[] = [];

      try {
        for (const [index, item] of files.entries()) {
          results.push(await uploadMediaFile(item.file, item.purpose));
          setState((current) => ({
            ...current,
            progress: Math.round(((index + 1) / files.length) * 100),
          }));
        }

        setState({ status: "done", progress: 100 });
        return results;
      } catch (error) {
        setState({ status: "error", progress: 0, error: getUploadError(error) });
        throw error;
      }
    },
    [],
  );

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, upload, uploadAll, reset };
}
