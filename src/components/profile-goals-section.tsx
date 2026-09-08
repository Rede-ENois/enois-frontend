import { Target } from "lucide-react";

import { texts } from "@/texts";
import { createProfileGoalsSectionViewModel } from "@/utils/components/profile/create-profile-goals-section-view-model";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ProfileSection } from "@/components/profile-section";

export function ProfileGoalsSection() {
  const { user } = useProfilePageContext();
  const { visible, goals } = createProfileGoalsSectionViewModel(user);

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
