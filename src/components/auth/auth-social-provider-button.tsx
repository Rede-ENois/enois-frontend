import { Loader2 } from "lucide-react";

import type { AuthSocialProviderButtonProps } from "@/types/components/auth/auth-social-provider-button-props";

export function AuthSocialProviderButton({ provider, disabled }: AuthSocialProviderButtonProps) {
  return (
    <button
      type="button"
      onClick={provider.action}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
    >
      {provider.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : provider.icon}
      <>{provider.label}</>
    </button>
  );
}
