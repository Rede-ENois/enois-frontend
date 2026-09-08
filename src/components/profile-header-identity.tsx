import { ProfileHeaderHeadline } from "@/components/profile-header-headline";
import { ProfileHeaderMetadata } from "@/components/profile-header-metadata";
import { ProfileHeaderName } from "@/components/profile-header-name";

export function ProfileHeaderIdentity() {
  return (
    <div className="mt-4">
      <ProfileHeaderName />
      <ProfileHeaderHeadline />
      <ProfileHeaderMetadata />
    </div>
  );
}
