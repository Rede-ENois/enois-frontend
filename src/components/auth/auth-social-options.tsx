import { AuthSocialDivider } from "@/components/auth/auth-social-divider";
import { AuthSocialProviderList } from "@/components/auth/auth-social-provider-list";

export function AuthSocialOptions() {
  return (
    <>
      <AuthSocialProviderList />
      <AuthSocialDivider />
    </>
  );
}
