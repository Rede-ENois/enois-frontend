import { apiRequest } from "@/lib/api-request";

export function markConversationAsRead(conversationId: string) {
  return apiRequest<void>("POST", `/conversations/${conversationId}/read`, undefined, {
    idempotent: true,
  });
}
