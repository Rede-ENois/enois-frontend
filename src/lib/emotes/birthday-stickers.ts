import { getEnoisEmojiByCode } from "./enois-pack";

/**
 * Figurinhas felizes do É Nóis que voam pelo perfil de quem faz aniversário hoje.
 *
 * O pacote é do repositório (`public/emojis/enois/`): o caminho sai daqui como URL relativa e o
 * servidor entrega o arquivo, sem passar pelo CDN. Só entram figurinhas felizes; as de raiva,
 * asco ou figurinha fixa ficam de fora. Quem desenha é o `BirthdayCelebration` do design system.
 */
const CODES = [
  "enois_party",
  "enois_confetti",
  "enois_joy",
  "enois_love",
  "enois_sparkle",
  "enois_starstruck",
  "enois_clap",
  "enois_hug",
  "enois_grin",
  "enois_hero",
  "enois_wave",
  "enois_raised",
] as const;

export const BIRTHDAY_CELEBRATION_STICKERS: readonly string[] = CODES.flatMap((code) => {
  const entry = getEnoisEmojiByCode(code);
  return entry ? [entry.src] : [];
});
