export type MediaAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  purpose: string;
  status: string;
  uploadUrl: string | null;
  cdnUrl: string | null;
  /** Pixel size, when the server knows it (images). */
  width?: number | null;
  height?: number | null;
  createdAt: string;
};
