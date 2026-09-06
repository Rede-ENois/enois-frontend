export type OAuthProvider = "GOOGLE" | "APPLE";

export type OAuthStartResponse = {
  provider: OAuthProvider;
  state: string;
  authorizationUrl: string;
};
