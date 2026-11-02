import type { Streak } from "@/types/application/streak/streak";

import { api } from "../api-client";

export const streakApi = {
  me: () => api.get<Streak>("/me/streak"),
};
