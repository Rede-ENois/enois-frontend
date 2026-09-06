import { Clock } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileAvailabilitySectionProps } from "@/types/components/profile/sidebar/profile-availability-section-props";

import { ProfileSection } from "../profile-section";

export function ProfileAvailabilitySection({ availability }: ProfileAvailabilitySectionProps) {
  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {availability ?? texts.profile.availabilityUnknown}
      </p>
    </ProfileSection>
  );
}
