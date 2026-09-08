import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

export function ProfileHeaderHeadline() {
  const { user } = useProfilePageContext();

  return <p className="mt-1 break-words text-[14px] font-light text-primary">{user.headline}</p>;
}
