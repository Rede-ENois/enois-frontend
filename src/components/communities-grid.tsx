import { useCommunitiesPageContext } from "@/utils/components/communities/use-communities-page-context";

import { CommunityCardProvider } from "@/components/community-card-provider";

export function CommunitiesGrid() {
  const { communities } = useCommunitiesPageContext();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCardProvider key={community.id} community={community} />
      ))}
    </div>
  );
}
