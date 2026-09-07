import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listRanking } from "@/lib/api/ranking";

export function useProfileRankingController() {
  const { data: ranking = [] } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => listRanking(10),
  });

  const items = ranking.slice(0, 5).map((rankedUser, index) => ({
    rankedUser,
    positionLabel: texts.profile.rankingPosition(index + 1),
    highlighted: index < 3,
  }));

  return {
    visible: items.length > 0,
    items,
  };
}
