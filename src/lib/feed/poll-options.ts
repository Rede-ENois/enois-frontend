import { POLL_MAX_OPTIONS } from "@/constants/post-types";

/** Alternativas prontas para publicar: sem vazio, sem repetição e dentro do teto do backend. */
export function normalizePollOptions(options: string[]): string[] {
  const seen = new Set<string>();
  return options
    .map((option) => option.trim())
    .filter((option) => {
      if (!option) return false;
      const key = option.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, POLL_MAX_OPTIONS);
}
