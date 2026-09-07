import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";
import { Clock } from "lucide-react";

import { createProfileAvailabilitySectionViewModel } from "@/utils/components/profile/create-profile-availability-section-view-model";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAvailabilitySection(props: ProfileSidebarProps) {
  const { availability } = createProfileAvailabilitySectionViewModel(props);

  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {availability}
      </p>
    </ProfileSection>
  );
}
