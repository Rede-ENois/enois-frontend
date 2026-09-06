import type { SessionTokens } from "./session-tokens";

export type AuthenticatedSession = SessionTokens & {
  user: unknown;
};
