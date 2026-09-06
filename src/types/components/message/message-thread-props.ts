import type { Conversation } from "@/lib/api";

import type { MessageListProps } from "./message-list-props";
import type { MessageThreadComposerProps } from "./message-thread-composer-props";

export type MessageThreadProps = Omit<MessageListProps, "otherUserId"> &
  MessageThreadComposerProps & {
    conversation: Conversation | null;
    onBack: () => void;
  };
