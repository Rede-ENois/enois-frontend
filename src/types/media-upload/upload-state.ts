import type { UploadFileState } from "@/types/media-upload/upload-file-state";
import type { UploadStatus } from "@/types/media-upload/upload-status";

export type UploadState = {
  status: UploadStatus;
  progress: number;
  error?: string;
  /** Indicadores por arquivo, com chave estável derivada do próprio arquivo. */
  files: Record<string, UploadFileState>;
};
