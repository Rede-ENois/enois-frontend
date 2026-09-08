import type { PageResponse } from "@/types/application/api/page-response";
import type { Message } from "@/types/messages/message";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listMessages(conversationId: string, cursor?: string | null, limit = 50) {
  return apiRequest<PageResponse<Message>>(
    "GET",
    `/conversations/${conversationId}/messages${buildQuery({ cursor, limit })}`,
  );
}
