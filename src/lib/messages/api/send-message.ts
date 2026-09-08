import type { Message } from "@/types/messages/message";

import { apiRequest } from "@/lib/api-request";

export function sendMessage(conversationId: string, text: string) {
  return apiRequest<Message>(
    "POST",
    `/conversations/${conversationId}/messages`,
    { text },
    { idempotent: true },
  );
}
