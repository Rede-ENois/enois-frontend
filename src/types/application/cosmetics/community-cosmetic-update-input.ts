import type { CommunityCosmeticDraftInput } from "./community-cosmetic-draft-input";

export type CommunityCosmeticUpdateInput = Partial<
  Pick<CommunityCosmeticDraftInput, "name" | "description" | "manifestJson" | "license">
> & {
  rightsConfirmed?: true;
};
