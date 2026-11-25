import type { ReactionType } from "./reaction-type";

/**
 * O coração roxo: um tipo de reação como qualquer outro para a API (ela grava o nome), e sem
 * posição fixa em `REACTION_TYPES` — a ordem da fileira é montada à parte (`REACTION_PICKER_ORDER`).
 * Ele não é uma das 76 expressões que `REACTION_EMOJI_ASSETS` percorre para casar reação e figurinha.
 */
export const PURPLE_HEART_REACTION = "HEART_PURPLE" as const;

/** Toda reação que a API aceita: as expressões do pacote mais o coração roxo. */
export type AnyReactionType = ReactionType | typeof PURPLE_HEART_REACTION;

export function isPurpleHeartReaction(type: string): type is typeof PURPLE_HEART_REACTION {
  return type === PURPLE_HEART_REACTION;
}
