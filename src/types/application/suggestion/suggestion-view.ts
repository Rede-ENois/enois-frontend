import type { SuggestionStatus } from "./suggestion-status";
import type { SuggestionTarget } from "./suggestion-target";

/** Visão de quem enviou: só o que escreveu e o andamento. */
export type SuggestionView = {
  id: string;
  target: SuggestionTarget;
  title: string;
  body: string;
  status: SuggestionStatus;
  githubIssueUrl: string | null;
  createdAt: string;
};
