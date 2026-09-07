import type { NetworkUser } from "@/types/application/network/network-user";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listNetworkSuggestions(limit = 4) {
  return apiRequest<NetworkUser[]>("GET", `/network/suggestions${buildQuery({ limit })}`);
}
