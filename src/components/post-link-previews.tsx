import type { PostView } from "@/types/application/feed/post-view";
import { extractVideoId } from "@/utils/extract-video-id";
import { getLinkMetadata } from "@/utils/get-link-metadata";

import { EmbedPlayer } from "@/components/post-embed-player";

export function LinkPreviews({ content }: Pick<PostView, "content">) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex) ?? [];
  const seen = new Set<string>();

  return (
    <>
      {urls.map((url) => {
        if (seen.has(url)) return null;
        seen.add(url);

        const video = extractVideoId(url);
        if (video) {
          return <EmbedPlayer key={url} type={video.type} id={video.id} />;
        }

        const link = getLinkMetadata(url);

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-[13px] font-light transition hover:bg-surface-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-primary">
              {link.initials}
            </div>

            <div className="min-w-0">
              <p className="truncate font-normal text-text-strong">{link.hostname}</p>

              <p className="truncate text-[11px] font-light text-text-subtle">{url}</p>
            </div>
          </a>
        );
      })}
    </>
  );
}
