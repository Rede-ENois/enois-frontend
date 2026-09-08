import type { AuthSocialProvider } from "@/types/components/auth/auth-social-provider";

import { AppleIcon } from "@/components/auth/apple-icon";
import { GoogleIcon } from "@/components/auth/google-icon";

export function AuthSocialProviderIcon({ provider }: Pick<AuthSocialProvider, "provider">) {
  return provider === "GOOGLE" ? <GoogleIcon /> : <AppleIcon />;
}
