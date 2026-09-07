const IMAGEKIT_URL_ENDPOINT =
  import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/socialcoisa";

export function resolveCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const cleaned = url.replace(/%2F/g, "/");
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `${IMAGEKIT_URL_ENDPOINT}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
}
