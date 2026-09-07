import { texts } from "@/texts";
import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { ProfileSection } from "@/components/profile-section";

export function ProfileAboutSection({ user }: ProfileHeaderProps) {
  if (!user.bio) return null;

  return (
    <ProfileSection title={texts.profile.sections.about}>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {user.bio}
      </p>
    </ProfileSection>
  );
}
