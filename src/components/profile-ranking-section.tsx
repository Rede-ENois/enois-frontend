import { texts } from "@/texts";
import { useProfileRankingController } from "@/utils/components/profile/use-profile-ranking-controller";
import { Trophy } from "lucide-react";

import { ProfileRankingItem } from "@/components/profile-ranking-item";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRankingSection() {
  const { visible, items } = useProfileRankingController();

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.ranking} icon={Trophy}>
      <div className="space-y-2">
        {items.map((item) => (
          <ProfileRankingItem key={item.rankedUser.id} {...item} />
        ))}
      </div>
    </ProfileSection>
  );
}
