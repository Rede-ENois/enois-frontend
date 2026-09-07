import type { RankingUser } from "@/types/application/ranking/ranking-user";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listRanking(limit = 20) {
  return apiRequest<RankingUser[]>("GET", `/profile/ranking${buildQuery({ limit })}`);
}
