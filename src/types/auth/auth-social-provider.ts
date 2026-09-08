import type { OAuthStartResponse } from "@/types/auth/oauth-start-response";

export type AuthSocialProvider = {
  key: string;
  provider: OAuthStartResponse["provider"];
  action: () => void;
  loading: boolean;
  label: string;
};
