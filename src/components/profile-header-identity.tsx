import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

import { ProfileHeaderHeadline } from "@/components/profile-header-headline";
import { ProfileHeaderMetadata } from "@/components/profile-header-metadata";
import { ProfileHeaderName } from "@/components/profile-header-name";

export function ProfileHeaderIdentity({ user }: ProfileHeaderProps) {
  return (
    <div className="mt-4">
      <ProfileHeaderName user={user} />
      <ProfileHeaderHeadline headline={user.headline} />
      <ProfileHeaderMetadata user={user} />
    </div>
  );
}
