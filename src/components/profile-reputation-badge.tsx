import { texts } from "@/texts";
import type { ProfileReputationBadgeProps } from "@/types/components/profile/profile-reputation-badge-props";

export function ProfileReputationBadge({ reputation }: ProfileReputationBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-[11px] font-light text-opportunity-foreground">
      {texts.profile.reputationMeta(reputation)}
    </span>
  );
}
