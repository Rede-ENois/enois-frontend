import type { SuggestionTarget } from "./suggestion-target";

export type SuggestionInput = {
  target: SuggestionTarget;
  title: string;
  body: string;
};
