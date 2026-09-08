import type { Community } from "@/types/application/community/community";

export function mergeCommunityPageItems(
  previous: Community[],
  incoming: Community[],
  append: boolean,
) {
  if (!append) return incoming;

  const existing = new Set(previous.map((community) => community.id));
  const newItems = incoming.filter((community) => !existing.has(community.id));
  return newItems.length > 0 ? [...previous, ...newItems] : previous;
}
