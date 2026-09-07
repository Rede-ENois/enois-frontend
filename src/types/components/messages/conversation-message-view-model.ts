import type { Message } from "@/types/application/message/message";

export type ConversationMessageViewModel = {
  message: Message;
  showAvatar: boolean;
  rowClassName: string;
  bubbleClassName: string;
  timeClassName: string;
  timeLabel: string;
};
