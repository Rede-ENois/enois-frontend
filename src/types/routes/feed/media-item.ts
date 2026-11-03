export type MediaItem = {
  type: "image" | "video" | "audio";
  file: File;
  preview: string;
  mediaId?: string;
  moderationStatus?: "checking" | "allowed" | "prohibited" | "blocked" | "error";
  moderationError?: string;
};
