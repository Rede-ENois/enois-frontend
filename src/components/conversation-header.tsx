import type { ConversationHeaderProps } from "@/types/components/messages/conversation-header-props";
import { useConversationHeaderController } from "@/utils/components/messages/use-conversation-header-controller";

import { ConversationHeaderBackButton } from "@/components/conversation-header-back-button";
import { ConversationHeaderIdentity } from "@/components/conversation-header-identity";

export function ConversationHeader(props: ConversationHeaderProps) {
  const { otherUser, title, profileUsername } = useConversationHeaderController(props);

  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <ConversationHeaderBackButton />
        <ConversationHeaderIdentity
          profileUsername={profileUsername}
          avatar={otherUser?.avatar}
          title={title}
          headline={otherUser?.headline}
        />
      </div>
    </header>
  );
}
