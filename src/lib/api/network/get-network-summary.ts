import type { NetworkSummary } from "@/types/application/network/network-summary";

import { apiRequest } from "@/lib/api-request";

export function getNetworkSummary() {
  return apiRequest<NetworkSummary>("GET", "/network/summary");
}
