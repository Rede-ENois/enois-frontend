import type { Conversation } from "@/types/application/message/conversation";

export type ConversationItemProps = {
  conversation: Pick<
    Conversation,
    | "id"
    | "participantIds"
    | "title"
    | "time"
    | "lastMessage"
    | "unread"
    | "lastMessageE2e"
    | "lastMessageIv"
    | "identities"
  >;
  isActive: boolean;
  onSelect: () => void;
  /** Modo de seleção em massa. */
  selecting?: boolean;
  selected?: boolean;
  onToggle?: () => void;
};
