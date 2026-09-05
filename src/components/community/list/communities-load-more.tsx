import { Loader2 } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

export function CommunitiesLoadMore({
  visible,
  loading,
  onLoadMore,
}: {
  visible: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  return visible ? (
    <div className="flex justify-center pb-8">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.communities.loadMore}
      </Button>
    </div>
  ) : null;
}
