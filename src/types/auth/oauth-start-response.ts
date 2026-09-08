export type OAuthStartResponse = {
  provider: "GOOGLE" | "APPLE";
  state: string;
  authorizationUrl: string;
};
