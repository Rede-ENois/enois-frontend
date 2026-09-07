import type { RankingUser } from "@/types/application/ranking/ranking-user";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const rankingApi = {
  list: (limit = 20) => apiRequest<RankingUser[]>("GET", `/profile/ranking${buildQuery({ limit })}`),
};
