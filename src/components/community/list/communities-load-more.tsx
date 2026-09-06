import { Loader2 } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

type CommunitiesLoadMoreProps = {
  isVisible: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
};

export function CommunitiesLoadMore({
  isVisible,
  isLoading,
  onLoadMore,
}: CommunitiesLoadMoreProps) {
  return isVisible ? (
    <div className="flex justify-center pb-8">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={onLoadMore}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.communities.loadMore}
      </Button>
    </div>
  ) : null;
}
