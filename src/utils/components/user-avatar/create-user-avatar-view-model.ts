import { texts } from "@/texts";
import type { UserAvatarProps } from "@/types/components/user-avatar/user-avatar-props";
import { getInitials } from "@/utils/get-initials";

import { resolveCdnUrl } from "@/lib/api/media";

export function createUserAvatarViewModel({
  src,
  alt,
  fallback,
  fallbackClassName,
}: UserAvatarProps) {
  const label = alt ?? texts.profile.avatarFallback;

  return {
    label,
    resolvedSrc: resolveCdnUrl(src),
    fallbackText: fallback ?? getInitials(label),
    fallbackClassName:
      fallbackClassName ??
      "bg-violet-300 text-violet-900 font-bold text-xl leading-[30px] tracking-normal",
  };
}
