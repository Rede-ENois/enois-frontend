import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

import { ComposerAction } from "@/components/composer-action";

export function FeedComposerActionList() {
  const { composerActions } = useFeedComposerContext();

  return (
    <div className="flex flex-wrap gap-1.5">
      {composerActions.map(({ key, ...action }) => (
        <ComposerAction key={key} {...action} />
      ))}
    </div>
  );
}
