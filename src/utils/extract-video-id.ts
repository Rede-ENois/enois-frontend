import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

export function extractVideoId(url: string): EmbedPlayerProps | null {
  const patterns: [RegExp, EmbedPlayerProps["type"]][] = [
    [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, "youtube"],
    [/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/, "dailymotion"],
    [/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/, "vimeo"],
    [/(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/)([a-zA-Z0-9_-]+)/, "twitch"],
    [/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/, "twitch"],
  ];

  for (const [regex, type] of patterns) {
    const match = url.match(regex);
    if (match) return { type, id: match[1] };
  }

  return null;
}
