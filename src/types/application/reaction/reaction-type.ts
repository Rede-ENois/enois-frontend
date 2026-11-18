/**
 * Reações oficiais, na ordem em que o seletor mostra — e a mesma do `ReactionType` do backend.
 *
 * É a lista inteira das oficiais, não uma seleção: cada tipo é um tipo de reação do servidor, e
 * o que não é reação do servidor (BTTV, FrankerFaceZ) não entra aqui — reagir é escolher entre as
 * oficiais.
 */
export const REACTION_TYPES = [
  "LIKE",
  "LOVE",
  "LAUGH",
  "ROFL",
  "SKULL",
  "WOW",
  "SAD",
  "SOB",
  "CELEBRATE",
  "SUPPORT",
  "INSIGHTFUL",
  "ANGRY",
  "DISGUST",
  "SKEPTICAL",
  "EYES",
  "NOTE",
  "FIRE",
  "CLAP",
  "CLOWN",
  "NAILS",
  // Contextuais: cada um tem situação clara de uso (ver ReactionType no backend).
  "USEFUL",
  "RELATABLE",
  "HYPE",
  "THANKS",
  "VIBE",
  "SALUTE",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];
