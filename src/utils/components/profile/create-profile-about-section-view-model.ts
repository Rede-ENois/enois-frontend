import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

export function createProfileAboutSectionViewModel({ user }: ProfileHeaderProps) {
  return {
    visible: Boolean(user.bio),
    bio: user.bio ?? "",
  };
}
