import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export const REACTION_EMOJIS = texts.posts.reactions.emojis;

/**
 * Ícones personalizados da Rede É Nóis para cada `ReactionType`, mantendo os códigos Unicode reais
 * em `REACTION_EMOJIS` para retrocompatibilidade com a API, acessibilidade e leitores de tela.
 */
export const REACTION_EMOJI_ASSETS: Record<ReactionType, string> = {
  LIKE: "/emojis/enois/like.webp",
  LOVE: "/emojis/enois/love.webp",
  LAUGH: "/emojis/enois/joy.webp",
  ROFL: "/emojis/enois/grin.webp",
  SKULL: "/emojis/enois/skull.webp",
  WOW: "/emojis/enois/wow.webp",
  SAD: "/emojis/enois/cry.webp",
  SOB: "/emojis/enois/pleading.webp",
  CELEBRATE: "/emojis/enois/confetti.webp",
  SUPPORT: "/emojis/enois/muscle.webp",
  INSIGHTFUL: "/emojis/enois/insightful.svg",
  ANGRY: "/emojis/enois/mad.webp",
  DISGUST: "/emojis/enois/nauseated.webp",
  SKEPTICAL: "/emojis/enois/monocle.webp",
  EYES: "/emojis/enois/eyes.webp",
  NOTE: "/emojis/enois/note.svg",
  FIRE: "/emojis/enois/fire.svg",
  CLAP: "/emojis/enois/clap.webp",
  CLOWN: "/emojis/enois/clown.svg",
  NAILS: "/emojis/enois/nails.svg",
  USEFUL: "/emojis/enois/useful.svg",
  RELATABLE: "/emojis/enois/hug.webp",
  HYPE: "/emojis/enois/rocket.webp",
  THANKS: "/emojis/enois/pray.webp",
  VIBE: "/emojis/enois/sparkle.webp",
  SALUTE: "/emojis/enois/salute.svg",
};
