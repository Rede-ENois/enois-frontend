import { communitiesApi } from "@/lib/api";

export type CommunityCropPurpose = "COVER" | "AVATAR";

export type CommunityFormValues = {
  name: string;
  description: string;
  cover: string;
  avatar: string;
};

export function buildCommunityUpdate(
  community: { name: string; description: string },
  values: CommunityFormValues,
): Parameters<typeof communitiesApi.update>[1] {
  return {
    name: values.name !== community.name ? values.name : undefined,
    description: values.description !== community.description ? values.description : undefined,
    cover: values.cover || null,
    avatar: values.avatar || null,
  };
}
