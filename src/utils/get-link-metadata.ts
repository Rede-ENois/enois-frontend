import { texts } from "@/texts";

export function getLinkMetadata(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return { hostname, initials: hostname.slice(0, 2).toUpperCase() };
  } catch {
    return { hostname: url, initials: texts.posts.video.icons.web };
  }
}
