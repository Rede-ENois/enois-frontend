import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";
import { Star } from "lucide-react";

import { listReceivedRecommendations } from "@/lib/api/recommendations";

import { ProfileRecommendationItem } from "@/components/profile-recommendation-item";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationsSection({ user }: ProfileSidebarProps) {
  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => listReceivedRecommendations(user.id),
  });

  if (recommendations.length === 0) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommendations} icon={Star}>
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <ProfileRecommendationItem key={recommendation.id} recommendation={recommendation} />
        ))}
      </div>
    </ProfileSection>
  );
}
