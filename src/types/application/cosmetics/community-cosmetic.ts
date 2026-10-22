import type { CommunityCosmeticKind } from "./community-cosmetic-kind";
import type { CommunityCosmeticStatus } from "./community-cosmetic-status";

export type CommunityCosmetic = {
  id: string;
  creatorId: string;
  kind: CommunityCosmeticKind;
  name: string;
  description: string;
  manifestJson: string;
  license: "ORIGINAL" | "OPEN_SOURCE" | "COMMERCIAL_LICENSE";
  status: CommunityCosmeticStatus;
  version: number;
  reported: number;
  createdAt: string;
  updatedAt: string;
};
