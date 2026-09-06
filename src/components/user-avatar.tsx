import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { UserAvatarProps } from "@/types/components/shared/user-avatar-props";
import { getInitials } from "@/utils/user";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar({ src, alt, className, fallback, fallbackClassName }: UserAvatarProps) {
  const label = alt ?? texts.profile.avatarFallback;
  const resolved = resolveCdnUrl(src);

  return (
    <Avatar className={className}>
      {resolved && <AvatarImage src={resolved} alt={label} />}
      <AvatarFallback className={fallbackClassName ?? "bg-violet-300 text-violet-900 font-bold text-xl leading-[30px] tracking-normal"}>
        {fallback ?? getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
