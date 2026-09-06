import type { VideoProvider } from "@/types/application/video/video-provider";
import type { VideoReference } from "@/types/application/video/video-reference";

const videoPatterns: Array<{ regex: RegExp; type: VideoProvider }> = [
  { regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, type: "youtube" },
  { regex: /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/, type: "dailymotion" },
  { regex: /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/, type: "vimeo" },
  { regex: /(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/)([a-zA-Z0-9_-]+)/, type: "twitch" },
  { regex: /twitch\.tv\/([a-zA-Z0-9_]+)\/?$/, type: "twitch" },
];

const thumbnailBuilders: Partial<Record<VideoProvider, (id: string) => string>> = {
  youtube: (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
  dailymotion: (id) => `https://www.dailymotion.com/thumbnail/video/${id}`,
};

const embedBuilders: Record<VideoProvider, (id: string, hostname: string) => string> = {
  youtube: (id) => `https://www.youtube.com/embed/${id}?autoplay=1`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
  dailymotion: (id) => `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
  twitch: (id, hostname) => `https://player.twitch.tv/?video=${id}&parent=${hostname}&autoplay=true`,
};

export const videoProviderLabels: Record<VideoProvider, string> = {
  youtube: "YouTube",
  dailymotion: "Dailymotion",
  vimeo: "Vimeo",
  twitch: "Twitch",
};

export const videoPlaceholderIcons: Record<VideoProvider, string> = {
  youtube: "▶️",
  dailymotion: "▶️",
  vimeo: "🎬",
  twitch: "📺",
};

export function extractVideoReference(url: string): VideoReference | null {
  const match = videoPatterns
    .map(({ regex, type }) => ({ match: url.match(regex), type }))
    .find(({ match }) => Boolean(match));
  return match?.match?.[1] ? { type: match.type, id: match.match[1] } : null;
}

export function getVideoThumbnail(type: VideoProvider, id: string): string | undefined {
  return thumbnailBuilders[type]?.(id);
}

export function getVideoEmbedUrl(type: VideoProvider, id: string): string {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  return embedBuilders[type](id, hostname);
}

export function extractUniqueUrls(content: string): string[] {
  return [...new Set(content.match(/https?:\/\/[^\s]+/g) ?? [])];
}

export function getUrlMetadata(url: string): { hostname: string; initials: string } {
  try {
    const hostname = new URL(url).hostname;
    return { hostname, initials: hostname.slice(0, 2).toUpperCase() };
  } catch {
    return { hostname: url, initials: "🌐" };
  }
}
