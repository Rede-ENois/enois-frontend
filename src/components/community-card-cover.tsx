import type { CommunityCardCoverProps } from "@/types/components/communities/community-card-cover-props";

export function CommunityCardCover({ coverUrl }: CommunityCardCoverProps) {
  return coverUrl ? (
    <img src={coverUrl} alt="" className="h-32 w-full object-cover" />
  ) : (
    <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
  );
}
