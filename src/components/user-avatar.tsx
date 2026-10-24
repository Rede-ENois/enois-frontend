import { texts } from "@/texts";
import type { UserAvatarProps } from "@/types/components/user-avatar/user-avatar-props";

import { resolveCdnUrl } from "@/lib/api/media";
import { ANIMATED_FRAMES, isFxFrame } from "@/lib/avatar-frames";
import { useAvatarAnimation } from "@/lib/use-avatar-animation";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AvatarFrameFx } from "@/components/avatar-frames/avatar-frame-fx";

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
  frameOverflow = "visible",
}: UserAvatarProps) {
  const label = alt ?? texts.profile.avatarFallback;
  const resolved = resolveCdnUrl(src);
  const fx = isFxFrame(frame);
  const animated = !!frame && ANIMATED_FRAMES.includes(frame);
  const animationRef = useAvatarAnimation(frame);
  const avatar = (
    <Avatar
      ref={fx ? undefined : animationRef}
      className={fx ? "h-full w-full" : className}
      data-avatar-frame={fx ? undefined : frame || undefined}
      data-avatar-animated={!fx && animated ? true : undefined}
    >
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
  if (!fx || !frame) return avatar;
  // As molduras com efeito saem do círculo e o Avatar corta tudo (overflow-hidden): o tamanho
  // e o layout de quem chamou vão para um invólucro, e o efeito fica ao lado do Avatar. Campos
  // de edição podem optar pelo corte para que a moldura nunca invada o texto.
  return (
    <span
      ref={animationRef}
      className={cn(
        "@container relative isolate flex h-10 w-10 shrink-0 rounded-full",
        frameOverflow === "hidden" && "overflow-hidden",
        className,
      )}
      data-avatar-frame={frame}
      data-avatar-animated
    >
      {avatar}
      <AvatarFrameFx frame={frame} />
    </span>
  );
}
