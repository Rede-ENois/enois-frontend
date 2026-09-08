import type { Community } from "@/types/application/community/community";

export function buildCommunityUpdateRequest(
  community: Pick<Community, "name" | "description">,
  form: { name: string; description: string; cover: string; avatar: string },
) {
  return {
    name: form.name !== community.name ? form.name : undefined,
    description: form.description !== community.description ? form.description : undefined,
    cover: form.cover || null,
    avatar: form.avatar || null,
  };
}
