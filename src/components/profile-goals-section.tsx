import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";
import { createProfileGoalsSectionViewModel } from "@/utils/components/profile/create-profile-goals-section-view-model";
import { Target } from "lucide-react";

import { ProfileSection } from "@/components/profile-section";

export function ProfileGoalsSection(props: ProfileHeaderProps) {
  const { visible, goals } = createProfileGoalsSectionViewModel(props);

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.goals} icon={Target}>
      <div className="grid gap-3 sm:grid-cols-3">
        {goals.map((goal) => (
          <div key={goal} className="rounded-xl border border-border-soft p-4">
            <p className="break-words text-[13px] font-light text-text-strong">{goal}</p>
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}
