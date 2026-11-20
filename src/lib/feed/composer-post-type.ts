import { POST_TYPES } from "@/constants/post-types";
import type { PostView } from "@/types/application/feed/post-view";

/** Tipos de post permitidos para a identidade ativa no compositor do feed. */
export function availableFeedPostTypes(identity: "SOCIAL" | "CORPORATE") {
  return identity === "CORPORATE"
    ? POST_TYPES.filter((option) => option.id === "BUSINESS")
    : POST_TYPES.filter((option) => option.id !== "BUSINESS");
}

/**
 * Garante que a identidade social nunca envie `BUSINESS` (mesmo após restaurar um rascunho antigo)
 * e que a identidade corporativa sempre envie `BUSINESS`.
 */
export function resolveFeedPostType(
  identity: "SOCIAL" | "CORPORATE",
  postType: PostView["type"],
): PostView["type"] {
  if (identity === "CORPORATE") return "BUSINESS";
  const allowed = availableFeedPostTypes(identity);
  return allowed.some((option) => option.id === postType)
    ? postType
    : ((allowed[0]?.id as PostView["type"] | undefined) ?? "INSIGHT");
}
