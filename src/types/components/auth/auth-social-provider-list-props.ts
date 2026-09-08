import type { AuthSocialProvider } from "@/types/components/auth/auth-social-provider";

export type AuthSocialProviderListProps = {
  providers: AuthSocialProvider[];
  disabled: boolean;
  error: string | null;
};
