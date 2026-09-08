import { Clock } from "lucide-react";

import { texts } from "@/texts";
import { createProfileAvailabilitySectionViewModel } from "@/utils/components/profile/create-profile-availability-section-view-model";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAvailabilitySection() {
  const { user } = useProfilePageContext();
  const { availability } = createProfileAvailabilitySectionViewModel(user);

  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {availability}
      </p>
    </ProfileSection>
  );
}
