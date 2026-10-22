import type { CommunityCosmetic } from "./community-cosmetic";
import type { CommunityCosmeticKind } from "./community-cosmetic-kind";

export type CommunityCosmeticDraftInput = {
  kind: CommunityCosmeticKind;
  name: string;
  description?: string;
  manifestJson: string;
  license: CommunityCosmetic["license"];
  rightsConfirmed: true;
};
