import { useQueries, useQuery } from "@tanstack/react-query";

import {
  feedApi,
  networkApi,
  profileApi,
  rankingApi,
  recommendationApi,
  type Profile,
} from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

export function useProfilePageData(loaderUser: Profile) {
  const { user: currentUser } = useAuth();
  const { data: liveProfile } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => profileApi.getByUsername(loaderUser.username),
    initialData: loaderUser,
  });
  const user = liveProfile ?? loaderUser;
  const isOwnProfile = currentUser?.id === user.id;

  const { data: connectionStatusData } = useQuery({
    queryKey: ["connection-status", user.id],
    queryFn: () => networkApi.getConnectionStatus(user.id),
    enabled: !isOwnProfile && Boolean(currentUser),
  });
  const { data: feedData } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => feedApi.listByUserId(user.id),
  });
  const { data: rankingData } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => rankingApi.list(10),
  });
  const { data: recommendationsData } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => recommendationApi.listReceived(user.id),
  });

  const recommendations = recommendationsData ?? [];
  const recommenderQueries = useQueries({
    queries: recommendations.map((recommendation) => ({
      queryKey: ["profile", "by-id", recommendation.recommenderId],
      queryFn: () => profileApi.getById(recommendation.recommenderId),
      staleTime: 60_000,
    })),
  });
  const recommenderByUserId = recommendations.reduce<Record<string, Profile>>(
    (profiles, recommendation, index) => {
      const recommender = recommenderQueries[index]?.data;
      if (recommender) profiles[recommendation.recommenderId] = recommender;
      return profiles;
    },
    {},
  );

  return {
    user,
    isOwnProfile,
    connectionStatus: connectionStatusData?.status ?? null,
    posts: feedData?.items ?? [],
    ranking: rankingData ?? [],
    recommendations,
    recommenderByUserId,
  };
}
