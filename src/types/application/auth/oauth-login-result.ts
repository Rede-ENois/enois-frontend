import type { AuthUser } from "./auth-user";

export type OAuthLoginResult = AuthUser | { accessScope: "SANCTIONS_ONLY" } | null;
