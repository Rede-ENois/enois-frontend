import { SOCIAL_PROVIDER_ICONS } from "@/constants/social-provider-icons";
import type { OAuthStartResponse } from "@/types/application/auth/oauth-start-response";

export function SocialProviderIcon({ provider }: Pick<OAuthStartResponse, "provider">) {
  const icon = SOCIAL_PROVIDER_ICONS[provider];

  return (
    <svg viewBox="0 0 24 24" className={icon.className} aria-hidden>
      <path fill={icon.fill} d={icon.path} />
    </svg>
  );
}
