import type { Community } from "./community";

export type CreateCommunityInput = Pick<Community, "name" | "description" | "topic"> &
  Partial<Pick<Community, "cover" | "avatar" | "bannerHtml" | "city" | "state">>;
