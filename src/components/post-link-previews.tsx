import type { PostView } from "@/types/application/feed/post-view";

import { createLinkPreviewsViewModel } from "@/utils/components/post/create-link-previews-view-model";

import { EmbedPlayer } from "@/components/post-embed-player";

export function LinkPreviews({ content }: Pick<PostView, "content">) {
  const previews = createLinkPreviewsViewModel(content);

  return (
    <>
      {previews.map((preview) =>
        preview.kind === "video" ? (
          <EmbedPlayer key={preview.key} type={preview.type} id={preview.id} />
        ) : (
          <a
            key={preview.key}
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-[13px] font-light transition hover:bg-surface-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-primary">
              {preview.initials}
            </div>

            <div className="min-w-0">
              <p className="truncate font-normal text-text-strong">{preview.hostname}</p>

              <p className="truncate text-[11px] font-light text-text-subtle">{preview.url}</p>
            </div>
          </a>
        ),
      )}
    </>
  );
}
