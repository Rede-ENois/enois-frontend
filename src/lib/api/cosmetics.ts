import type { CommunityCosmetic } from "@/types/application/cosmetics/community-cosmetic";
import type { CommunityCosmeticDraftInput } from "@/types/application/cosmetics/community-cosmetic-draft-input";
import type { CommunityCosmeticKind } from "@/types/application/cosmetics/community-cosmetic-kind";
import type { CommunityCosmeticUpdateInput } from "@/types/application/cosmetics/community-cosmetic-update-input";
import type { ProfileNameStyle } from "@/types/application/cosmetics/profile-name-style";

import { api, buildQuery } from "../api-client";

/** Contratos da criação e catálogo de cosméticos da comunidade. */
export const cosmeticsApi = {
  catalog: (options?: { limit?: number; kind?: CommunityCosmeticKind }) =>
    api.get<CommunityCosmetic[]>(
      `/cosmetics/catalog${buildQuery({ limit: options?.limit, kind: options?.kind })}`,
    ),
  get: (cosmeticId: string) => api.get<CommunityCosmetic>(`/cosmetics/${cosmeticId}`),
  mine: () => api.get<CommunityCosmetic[]>("/cosmetics/mine"),
  createDraft: (data: CommunityCosmeticDraftInput) =>
    api.post<CommunityCosmetic>("/cosmetics/drafts", data),
  update: (cosmeticId: string, data: CommunityCosmeticUpdateInput) =>
    api.patch<CommunityCosmetic>(`/cosmetics/${cosmeticId}`, data),
  submit: (cosmeticId: string) =>
    api.post<{ id: string; status: CommunityCosmetic["status"] }>(
      `/cosmetics/${cosmeticId}/submit`,
      {},
    ),
  report: (cosmeticId: string) =>
    api.post<{ status: "REPORTED" }>(`/cosmetics/${cosmeticId}/report`, {}),
  setNameStyle: (data: ProfileNameStyle) =>
    api.put<ProfileNameStyle>("/cosmetics/profile/name-style", data),
};
