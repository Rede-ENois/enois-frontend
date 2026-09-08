import { useCommunityHeaderContext } from "@/utils/components/communities/use-community-header-context";

export function CommunityHeaderMedia() {
  const { coverUrl } = useCommunityHeaderContext();

  return coverUrl ? (
    <img src={coverUrl} alt="" className="h-48 w-full object-cover" />
  ) : (
    <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
  );
}
