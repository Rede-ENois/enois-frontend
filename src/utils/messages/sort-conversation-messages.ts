import type { Message } from "@/types/application/message/message";

export function sortConversationMessages(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
}
