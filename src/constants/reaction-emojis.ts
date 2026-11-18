import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { getEnoisEmojiByCode } from "@/lib/emotes/enois-pack";

/** Emoji de cada reação oficial (Unicode de verdade: a API guarda o tipo, o leitor de tela lê o símbolo). */
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  ROFL: "🤣",
  SKULL: "💀",
  WOW: "😮",
  SAD: "😢",
  SOB: "😭",
  CELEBRATE: "🎉",
  SUPPORT: "💪",
  INSIGHTFUL: "💡",
  ANGRY: "😡",
  DISGUST: "🤢",
  SKEPTICAL: "🧐",
  EYES: "👀",
  NOTE: "📝",
  FIRE: "🔥",
  CLAP: "👏",
  CLOWN: "🤡",
  NAILS: "💅",
  // Contextuais: cada um tem situação clara de uso (ver ReactionType no backend).
  USEFUL: "🧰",
  RELATABLE: "🫂",
  HYPE: "🚀",
  THANKS: "🙏",
  VIBE: "✨",
  SALUTE: "🫡",
};

/** Thumbnail oficial de uma reação: o próprio ícone do pacote É Nóis (o mesmo que o texto mostra). */
function officialAsset(slug: string): string {
  const src = getEnoisEmojiByCode(`enois_${slug}`)?.src;
  if (!src) throw new Error(`Reação oficial sem ícone no pacote É Nóis: enois_${slug}`);
  return src;
}

/**
 * Ícones oficiais da Rede É Nóis para cada `ReactionType`. Só o pacote É Nóis entra aqui: a lista
 * de reações é a das oficiais, sem figuras de BTTV/FrankerFaceZ — essas são do texto, não da reação.
 */
export const REACTION_EMOJI_ASSETS: Record<ReactionType, string> = {
  LIKE: officialAsset("like"),
  LOVE: officialAsset("love"),
  LAUGH: officialAsset("joy"),
  ROFL: officialAsset("grin"),
  SKULL: officialAsset("skull"),
  WOW: officialAsset("wow"),
  SAD: officialAsset("cry"),
  SOB: officialAsset("pleading"),
  CELEBRATE: officialAsset("confetti"),
  SUPPORT: officialAsset("muscle"),
  INSIGHTFUL: officialAsset("insightful"),
  ANGRY: officialAsset("mad"),
  DISGUST: officialAsset("nauseated"),
  SKEPTICAL: officialAsset("monocle"),
  EYES: officialAsset("eyes"),
  NOTE: officialAsset("note"),
  FIRE: officialAsset("fire"),
  CLAP: officialAsset("clap"),
  CLOWN: officialAsset("clown"),
  NAILS: officialAsset("nails"),
  USEFUL: officialAsset("useful"),
  RELATABLE: officialAsset("hug"),
  HYPE: officialAsset("rocket"),
  THANKS: officialAsset("pray"),
  VIBE: officialAsset("sparkle"),
  SALUTE: officialAsset("salute"),
};
