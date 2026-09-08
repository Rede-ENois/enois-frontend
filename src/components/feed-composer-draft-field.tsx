import { texts } from "@/texts";
import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposerDraftField() {
  const { profileAvatar, profileName, draft, handleDraftChange } = useFeedComposerContext();

  return (
    <div className="flex items-center gap-3">
      <UserAvatar src={profileAvatar} alt={profileName} className="h-11 w-11" />
      <MentionTextarea
        value={draft}
        onChange={handleDraftChange}
        placeholder={texts.feed.composer.placeholder}
        className="min-h-11 flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-[14px] font-light"
        maxLength={600}
      />
    </div>
  );
}
