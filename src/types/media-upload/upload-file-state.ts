import type { UploadStatus } from "@/types/media-upload/upload-status";

export type UploadFileState = {
  status: UploadStatus;
  progress: number;
  error?: string;
};
