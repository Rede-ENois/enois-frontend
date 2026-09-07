import type { PostCardState } from "@/types/stores/post-card-state";

export function updatePostCard(
  cards: Record<string, PostCardState>,
  postId: string,
  update: (card: PostCardState) => PostCardState,
) {
  const card = cards[postId];
  if (!card) return cards;

  return {
    ...cards,
    [postId]: update(card),
  };
}
