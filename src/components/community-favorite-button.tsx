import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Star } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Chave única das comunidades favoritadas: alimenta a estrela dos cards e a seção do menu. */
export const COMMUNITY_FAVORITES_KEY = ["community-favorites"];

/** Estrela para favoritar/desfavoritar uma comunidade (bookmark, não exige participar). */
export function CommunityFavoriteButton({
  communityId,
  className,
}: {
  communityId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
  });
  const isFavorite = (data?.items ?? []).some((c) => c.id === communityId);

  const toggle = useMutation({
    mutationFn: () =>
      isFavorite ? communitiesApi.unfavorite(communityId) : communitiesApi.favorite(communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMUNITY_FAVORITES_KEY }),
  });

  const label = isFavorite ? texts.communities.unfavorite : texts.communities.favorite;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isFavorite}
      disabled={toggle.isPending}
      // O card inteiro é um Link: sem isso o clique navegaria junto com o favoritar.
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate();
      }}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border-soft bg-surface-card/85 backdrop-blur transition hover:bg-surface-2 disabled:opacity-60",
        className,
      )}
    >
      <Star
        className={cn("h-4 w-4", isFavorite ? "fill-primary text-primary" : "text-text-subtle")}
      />
    </button>
  );
}
