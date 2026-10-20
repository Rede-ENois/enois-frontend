import { texts } from "@/texts";
import type { UserAvatarProps } from "@/types/components/user-avatar/user-avatar-props";

import { resolveCdnUrl } from "@/lib/api/media";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? texts.profile.avatarUnknown;
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export function UserAvatar({
  src,
  alt,
  className,
  fallback,
  fallbackClassName,
  frame,
}: UserAvatarProps) {
  const label = alt ?? texts.profile.avatarFallback;
  const resolved = resolveCdnUrl(src);
  return (
    <Avatar className={className} data-avatar-frame={frame || undefined}>
      {resolved && <AvatarImage src={resolved} alt={label} />}
      <AvatarFallback
        className={
          fallbackClassName ??
          // 38cqw acompanha o container do Avatar: as iniciais ficam proporcionais tanto
          // no avatar de h-6 (comentário) quanto no grande do perfil.
          "bg-violet-300 text-violet-900 font-bold text-[38cqw] leading-none tracking-normal"
        }
      >
        {fallback ?? getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
