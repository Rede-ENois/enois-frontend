export type MediaAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  purpose: string;
  status: string;
  uploadUrl: string | null;
  cdnUrl: string | null;
  createdAt: string;
};
