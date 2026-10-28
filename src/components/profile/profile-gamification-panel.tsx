import { useQuery } from "@tanstack/react-query";

import type { ProfileGamificationPanelProps } from "@/types/components/profile/profile-gamification-panel-props";
import { ProfileGamificationPanel as ProfileGamificationPanelView } from "@rede-enois/design-system/domain";

import { walletApi } from "@/lib/api";
import { formatFaisca } from "@/lib/faisca";

export function ProfileGamificationPanel({
  profile,
  isOwner,
  postsCount,
}: ProfileGamificationPanelProps) {
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.wallet(),
    enabled: isOwner,
    staleTime: 60_000,
  });

  return (
    <ProfileGamificationPanelView
      profile={profile}
      isOwner={isOwner}
      postsCount={postsCount}
      walletBalance={wallet ? formatFaisca(wallet.balance) : null}
      walletHref="/carteira"
    />
  );
}
