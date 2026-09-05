import { useState } from "react";

import { Eye, EyeOff, Loader2 } from "lucide-react";

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
              {loading === provider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon />}
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden>
      <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2.9-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3.1 2.4 1.3-.1 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.7-3.9zM14 5.4c.7-.8 1.2-1.9 1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z" />
    </svg>
  );
}
