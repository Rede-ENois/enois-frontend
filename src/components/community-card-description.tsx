import { useCommunityCardContext } from "@/utils/components/communities/use-community-card-context";

export function CommunityCardDescription() {
  const { community } = useCommunityCardContext();

  return (
    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
  );
}
