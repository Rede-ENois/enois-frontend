import type { CreateCommunityInput } from "@/types/application/community/create-community-input";
import type { CommunityFormValues } from "@/types/components/community/community-form-values";

export function buildCommunityUpdate(
  community: { name: string; description: string },
  values: CommunityFormValues,
): Partial<CreateCommunityInput> {
  return {
    name: values.name !== community.name ? values.name : undefined,
    description: values.description !== community.description ? values.description : undefined,
    cover: values.cover || null,
    avatar: values.avatar || null,
  };
}
