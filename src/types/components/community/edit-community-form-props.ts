import type { Community } from "@/types/application/community/community";

export type EditCommunityFormProps = {
  community: Community;
  onClose: () => void;
};
