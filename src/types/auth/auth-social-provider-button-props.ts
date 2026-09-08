import type { AuthSocialProvider } from "@/types/auth/auth-social-provider";

export type AuthSocialProviderButtonProps = {
  provider: AuthSocialProvider;
  disabled: boolean;
};
