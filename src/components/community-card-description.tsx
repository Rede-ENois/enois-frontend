import type { CommunityCardDescriptionProps } from "@/types/components/communities/community-card-description-props";

export function CommunityCardDescription({ description }: CommunityCardDescriptionProps) {
  return <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>;
}
