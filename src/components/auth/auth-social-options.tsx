import { texts } from "@/texts";

import { useAuthSocialOptionsController } from "@/utils/components/auth/use-auth-social-options-controller";

import { AuthSocialDivider } from "@/components/auth/auth-social-divider";
import { AuthSocialProviderList } from "@/components/auth/auth-social-provider-list";
import { AppleIcon } from "@/components/auth/apple-icon";
import { GoogleIcon } from "@/components/auth/google-icon";

export function AuthSocialOptions() {
  const { error, disabled, google, apple } = useAuthSocialOptionsController();
  const providers = [
    {
      key: "google",
      action: google.start,
      loading: google.loading,
      icon: <GoogleIcon />,
      label: texts.auth.social.google,
    },
    {
      key: "apple",
      action: apple.start,
      loading: apple.loading,
      icon: <AppleIcon />,
      label: texts.auth.social.apple,
    },
  ];

  return (
    <>
      <AuthSocialProviderList providers={providers} disabled={disabled} error={error} />
      <AuthSocialDivider />
    </>
  );
}
