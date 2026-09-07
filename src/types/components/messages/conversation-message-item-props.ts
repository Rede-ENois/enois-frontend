import type { ConversationMessageViewModel } from "@/types/components/messages/conversation-message-view-model";

export type ConversationMessageItemProps = {
  item: ConversationMessageViewModel;
  otherProfileUsername: string;
  otherAvatar?: string | null;
  otherName?: string;
};
