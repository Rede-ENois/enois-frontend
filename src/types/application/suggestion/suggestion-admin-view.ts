import type { SuggestionStatus } from "./suggestion-status";
import type { SuggestionTarget } from "./suggestion-target";

export type SuggestionAdminView = {
  id: string;
  userId: string;
  target: SuggestionTarget;
  title: string;
  body: string;
  status: SuggestionStatus;
  githubIssueNumber: string | null;
  githubIssueUrl: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};
