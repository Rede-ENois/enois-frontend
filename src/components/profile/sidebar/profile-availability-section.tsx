import { Clock } from "lucide-react";

import { texts } from "@/texts";

import { ProfileSection } from "../profile-section";

type ProfileAvailabilitySectionProps = {
  availability?: string | null;
};

export function ProfileAvailabilitySection({ availability }: ProfileAvailabilitySectionProps) {
  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {availability ?? texts.profile.availabilityUnknown}
      </p>
    </ProfileSection>
  );
}
