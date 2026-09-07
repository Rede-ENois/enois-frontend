import type { MediaAsset } from "@/types/application/media/media-asset";
import type { MediaUploadResponse } from "@/types/application/media/media-upload-response";

import { apiRequest } from "../api-request";
import { getImageKitAuth } from "./imagekit-auth.fn";

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY ?? "public_0Y+bnNURFVY+XZuqyCWQGafHo/0=";
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ?? "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/socialcoisa";

export function resolveCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const cleaned = url.replace(/%2F/g, "/");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `${IMAGEKIT_URL_ENDPOINT}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
}

export const mediaApi = {
  requestUpload: (data: Pick<MediaAsset, "fileName" | "mimeType" | "size" | "purpose">) => apiRequest<MediaUploadResponse>("POST", "/media/uploads", data, { idempotent: true }),
  get: (mediaId: string) => apiRequest<MediaAsset>("GET", `/media/${mediaId}`),
  delete: (mediaId: string) => apiRequest<Pick<MediaAsset, "id" | "status">>("DELETE", `/media/${mediaId}`, null, { idempotent: true }),
  uploadToImageKit: async (cdnUrl: string, file: File) => {
    const absoluteUrl = resolveCdnUrl(cdnUrl) ?? cdnUrl;
    const fullPath = decodeURIComponent(absoluteUrl.replace(/^https:\/\/ik\.imagekit\.io\/[^/]+\//, ""));
    const lastSlash = fullPath.lastIndexOf("/");
    const folder = lastSlash >= 0 ? fullPath.slice(0, lastSlash) : "";
    const fileName = lastSlash >= 0 ? fullPath.slice(lastSlash + 1) : fullPath;
    const { signature, token, expire } = await getImageKitAuth();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);
    formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
    formData.append("signature", signature);
    formData.append("token", token);
    formData.append("expire", String(expire));
    formData.append("useUniqueFileName", "false");
    formData.append("overwriteFile", "true");
    if (folder) formData.append("folder", folder);
    const response = await fetch(IMAGEKIT_UPLOAD_URL, { method: "POST", body: formData });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Upload para ImageKit falhou: ${response.status} ${body}`);
    }
  },
};
