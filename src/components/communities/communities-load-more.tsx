import { texts } from "@/texts";
import { useCommunitiesPageContext } from "@/utils/communities/use-communities-page-context";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommunitiesLoadMore() {
  const { showLoadMore, isFetching, loadMoreDisabled, loadMore } = useCommunitiesPageContext();

  if (!showLoadMore) return null;

  return (
    <div className="flex justify-center pb-8">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={loadMore}
        disabled={loadMoreDisabled}
      >
        {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.communities.loadMore}
      </Button>
    </div>
  );
}
