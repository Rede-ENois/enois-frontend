import { useAuthSocialOptionsController } from "@/utils/components/auth/use-auth-social-options-controller";

import { AuthSocialDivider } from "@/components/auth/auth-social-divider";
import { AuthSocialProviderList } from "@/components/auth/auth-social-provider-list";

export function AuthSocialOptions() {
  const { error, disabled, providers } = useAuthSocialOptionsController();

  return (
    <>
      <AuthSocialProviderList providers={providers} disabled={disabled} error={error} />
      <AuthSocialDivider />
    </>
  );
}
