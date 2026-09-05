import type { Profile } from "@/lib/api";
import { texts } from "@/texts";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposerInput({
  profile,
  draft,
  onDraftChange,
}: {
  profile: Profile | null | undefined;
  draft: string;
  onDraftChange: (value: string, mentionedUserIds: string[]) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        src={profile?.avatar}
        alt={profile?.name ?? texts.feed.you}
        className="h-11 w-11"
      />
      <MentionTextarea
        value={draft}
        onChange={onDraftChange}
        placeholder={texts.feed.composer.placeholder}
        className="min-h-11 flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-[14px] font-light"
        maxLength={600}
      />
    </div>
  );
}
