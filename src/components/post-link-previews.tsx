import {
  extractUniqueUrls,
  extractVideoReference,
  getUrlMetadata,
} from "@/utils/video";

import { EmbedPlayer } from "@/components/post-link-previews/embed-player";

export function PostLinkPreviews({ content }: { content: string }) {
  return (
    <>
      {extractUniqueUrls(content).map((url) => {
        const video = extractVideoReference(url);
        if (video) return <EmbedPlayer key={url} type={video.type} id={video.id} />;

        const metadata = getUrlMetadata(url);
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-[13px] font-light transition hover:bg-surface-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-primary">
              {metadata.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-normal text-text-strong">{metadata.hostname}</p>
              <p className="truncate text-[11px] font-light text-text-subtle">{url}</p>
            </div>
          </a>
        );
      })}
    </>
  );
}
