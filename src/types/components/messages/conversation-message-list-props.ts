import type { RefObject } from "react";

import type { ConversationMessageViewModel } from "@/types/components/messages/conversation-message-view-model";

export type ConversationMessageListProps = {
  items: ConversationMessageViewModel[];
  showEmptyState: boolean;
  otherProfileUsername: string;
  otherAvatar?: string | null;
  otherName?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};
