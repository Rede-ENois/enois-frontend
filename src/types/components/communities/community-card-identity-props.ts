import type { Community } from "@/types/application/community/community";

export type CommunityCardIdentityProps = {
  community: Pick<Community, "topic" | "name">;
  avatarUrl?: string | null;
};
