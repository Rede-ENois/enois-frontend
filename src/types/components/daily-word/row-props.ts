import type { WordMark } from "@/types/application/daily-games/word-mark";

export interface RowProps {
  letters: string[];
  marks: WordMark[] | null;
  shake: boolean;
  animateReveal: boolean;
}
