import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";
import { Clock } from "lucide-react";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAvailabilitySection({ user }: ProfileSidebarProps) {
  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {user.availability ?? texts.profile.availabilityUnknown}
      </p>
    </ProfileSection>
  );
}
