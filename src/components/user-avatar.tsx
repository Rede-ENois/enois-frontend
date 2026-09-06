import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { UserAvatarProps } from "@/types/components/user-avatar/user-avatar-props";
import { getInitials } from "@/utils/get-initials";

import { Avatar } from "@/components/ui/avatar";

export function UserAvatar({ src, alt, className, fallback, fallbackClassName }: UserAvatarProps) {
  const label = alt ?? texts.profile.avatarFallback;
  const resolved = resolveCdnUrl(src);

  return (
    <Avatar type="root" className={className}>
      {resolved && <Avatar type="image" src={resolved} alt={label} />}
      <Avatar
        type="fallback"
        className={
          fallbackClassName ??
          "bg-violet-300 text-violet-900 font-bold text-xl leading-[30px] tracking-normal"
        }
      >
        {fallback ?? getInitials(label)}
      </Avatar>
    </Avatar>
  );
}
