import type { Community } from "@/types/application/community/community";

export type EditCommunityFormProps = {
  community: Pick<
    Community,
    "id" | "name" | "description" | "topic" | "cover" | "avatar" | "bannerHtml" | "city" | "state"
  >;
  onClose: () => void;
};
