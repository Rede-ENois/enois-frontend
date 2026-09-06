export type MediaUploadResponse = {
  id: string;
  uploadUrl: string;
  cdnUrl: string;
  status: "PENDING" | "UPLOADED" | "FAILED";
};
