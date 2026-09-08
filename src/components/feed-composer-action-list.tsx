import type { FeedComposerActionListProps } from "@/types/components/feed/feed-composer-action-list-props";

import { ComposerAction } from "@/components/composer-action";

export function FeedComposerActionList({ actions }: FeedComposerActionListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map(({ key, ...action }) => (
        <ComposerAction key={key} {...action} />
      ))}
    </div>
  );
}
