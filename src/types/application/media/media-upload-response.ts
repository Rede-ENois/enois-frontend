export type MediaUploadResponse = {
  id: string;
  uploadUrl: string;
  cdnUrl: string;
  status: "PENDING" | "UPLOADED" | "FAILED";
};

export type UploadResult = Pick<MediaUploadResponse, "cdnUrl"> & {
  mediaId: MediaUploadResponse["id"];
};
