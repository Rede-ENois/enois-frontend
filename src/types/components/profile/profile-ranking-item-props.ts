import type { RankingUser } from "@/types/application/ranking/ranking-user";

export type ProfileRankingItemProps = {
  rankedUser: RankingUser;
  positionLabel: string;
  highlighted: boolean;
};
