import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { ProfileHeaderHeadline } from "@/components/profile-header-headline";
import { ProfileHeaderMetadata } from "@/components/profile-header-metadata";
import { ProfileHeaderName } from "@/components/profile-header-name";

export function ProfileHeaderIdentity() {
  const { user } = useProfilePageContext();

  return (
    <div className="mt-4">
      <ProfileHeaderName />
      <ProfileHeaderHeadline headline={user.headline} />
      <ProfileHeaderMetadata />
    </div>
  );
}
