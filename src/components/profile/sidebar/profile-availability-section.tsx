import { Clock } from "lucide-react";

import { texts } from "@/texts";

import { ProfileSection } from "../profile-section";

export function ProfileAvailabilitySection({ availability }: { availability?: string | null }) {
  return (
    <ProfileSection title={texts.profile.sections.availability} icon={Clock}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {availability ?? texts.profile.availabilityUnknown}
      </p>
    </ProfileSection>
  );
}
