import type { OAuthProvider } from "./oauth-provider";

export type OAuthStartResponse = {
  provider: OAuthProvider;
  state: string;
  authorizationUrl: string;
};
