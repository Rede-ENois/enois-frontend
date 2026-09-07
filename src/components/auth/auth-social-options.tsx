import { texts } from "@/texts";
import { Loader2 } from "lucide-react";

import { useAuthSocialOptionsController } from "@/utils/components/auth/use-auth-social-options-controller";

import { AppleIcon } from "./apple-icon";
import { GoogleIcon } from "./google-icon";

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
      <div className="grid gap-2">
        {providers.map((provider) => (
          <button
            key={provider.key}
            type="button"
            onClick={provider.action}
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
          >
            {provider.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : provider.icon}
            <>{provider.label}</>
          </button>
        ))}

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />

        <>{texts.auth.social.divider}</>

        <div className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
