import { getImageKitAuth } from "@/lib/api/imagekit-auth.fn";
import { resolveCdnUrl } from "@/lib/api/media";

const IMAGEKIT_PUBLIC_KEY =
  import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY ?? "public_0Y+bnNURFVY+XZuqyCWQGafHo/0=";
const IMAGEKIT_UPLOAD_URL =
  import.meta.env.VITE_IMAGEKIT_UPLOAD_URL ?? "https://upload.imagekit.io/api/v1/files/upload";

export async function uploadToImageKit(cdnUrl: string, file: File) {
  const absoluteUrl = resolveCdnUrl(cdnUrl) ?? cdnUrl;
  const fullPath = decodeURIComponent(
    absoluteUrl.replace(/^https:\/\/ik\.imagekit\.io\/[^/]+\//, ""),
  );
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
}
