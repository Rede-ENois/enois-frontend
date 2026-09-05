import { useState } from "react";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { AppleIcon } from "@/assets/svgs/apple-icon";
import { GoogleIcon } from "@/assets/svgs/google-icon";
import { texts } from "@/texts";

import { Label } from "@/components/ui/label";

type OAuthProvider = "GOOGLE" | "APPLE";

const oauthProviders: Record<OAuthProvider, { name: string; label: string; Icon: React.ElementType }> = {
  GOOGLE: { name: "Google", label: texts.auth.social.google, Icon: GoogleIcon },
  APPLE: { name: "Apple", label: texts.auth.social.apple, Icon: AppleIcon },
};

export function SocialButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setError(texts.auth.social.unavailable(oauthProviders[provider].name));
    setLoading(null);
  };

  return (
    <div className="grid gap-2">
      {(Object.entries(oauthProviders) as [OAuthProvider, (typeof oauthProviders)[OAuthProvider]][]).map(
        ([provider, config]) => {
          const { Icon } = config;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => startOAuth(provider)}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {loading === provider ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {config.label}
            </button>
          );
        },
      )}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      {texts.auth.social.divider}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function PasswordVisibilityButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  const Icon = show ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
      aria-label={show ? texts.auth.password.hide : texts.auth.password.show}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Field({
  label,
  error,
  right,
  children,
}: {
  label: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {right}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
