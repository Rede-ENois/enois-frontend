import type { RankingUser } from "@/types/application/ranking/ranking-user";

import { api, buildQuery } from "../api-client";

export type { RankingUser } from "@/types/application/ranking/ranking-user";

export const rankingApi = {
  list: (limit = 20) => api.get<RankingUser[]>(`/profile/ranking${buildQuery({ limit })}`),
};
