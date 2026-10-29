/** A cópia do índice no `localStorage` (caminhos relativos, com o horário em que foi salva). */
export type CachedEmoteIndex = {
  entries: Record<string, string>;
  savedAt: number;
};
