import type { PageResponse } from "@/types/application/api/page-response";
import type { Conversation } from "@/types/application/message/conversation";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listConversations(cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<Conversation>>(
    "GET",
    `/conversations${buildQuery({ cursor, limit })}`,
  );
}
