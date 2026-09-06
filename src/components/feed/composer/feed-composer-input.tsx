import type { Profile } from "@/lib/api";
import { texts } from "@/texts";

import { MentionTextarea } from "@/components/mention-textarea/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

type FeedComposerInputProps = {
  profile: Profile | null | undefined;
  content: string;
  onContentChange: (value: string, mentionedUserIds: string[]) => void;
};

export function FeedComposerInput({
  profile,
  content,
  onContentChange,
}: FeedComposerInputProps) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        src={profile?.avatar}
        alt={profile?.name ?? texts.feed.you}
        className="h-11 w-11"
      />
      <MentionTextarea
        value={content}
        onChange={onContentChange}
        placeholder={texts.feed.composer.placeholder}
        className="min-h-11 flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-[14px] font-light"
        maxLength={600}
      />
    </div>
  );
}
