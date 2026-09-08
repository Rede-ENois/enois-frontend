import { texts } from "@/texts";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";

export const AUTH_SOCIAL_PROVIDERS = [
  { key: "google", provider: "GOOGLE", label: texts.auth.social.google },
  { key: "apple", provider: "APPLE", label: texts.auth.social.apple },
] as const satisfies ReadonlyArray<{
  key: string;
  provider: OAuthStartResponse["provider"];
  label: string;
}>;
