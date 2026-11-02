import type { MentorBannerProps } from "@/types/components/mentoring/mentor-banner-props";

import { resolveCdnUrl } from "@/lib/api/media";
import { cn } from "@/lib/utils";

/**
 * Banner do mentor inteiro, sem recorte.
 *
 * A altura era fixa (144px) com `object-cover`: a imagem é um cartaz com texto e o recorte tirava
 * informação nas duas larguras. Agora a imagem manda na proporção e só um teto de altura evita que
 * um arquivo quadrado domine o card.
 */
export function MentorBanner({ src, className }: MentorBannerProps) {
  return (
    <img
      src={resolveCdnUrl(src)}
      alt=""
      className={cn("max-h-[min(60vh,22rem)] w-full object-contain", className)}
    />
  );
}
