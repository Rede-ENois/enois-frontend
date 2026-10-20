import type { WordMark } from "./word-mark";

export type WordState = {
  date: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "WON" | "LOST";
  guesses: { word: string; marks: WordMark[] }[];
  streak: number;
};
