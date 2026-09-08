import { useAuthSocialOptionsController } from "@/utils/components/auth/use-auth-social-options-controller";

import { AuthSocialProviderButton } from "@/components/auth/auth-social-provider-button";

export function AuthSocialProviderList() {
  const { providers, disabled, error } = useAuthSocialOptionsController();

  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <AuthSocialProviderButton key={provider.key} provider={provider} disabled={disabled} />
      ))}

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
