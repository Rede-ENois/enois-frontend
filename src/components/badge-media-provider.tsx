import { useCallback, useEffect, useState } from "react";

import type { BadgeMediaProviderProps } from "@/types/components/badge-media-provider-props";
import { isOfficialBadgeId } from "@rede-enois/design-system/domain";

import { resolveCdnUrl } from "@/lib/api/media";

import { DesignSystemProvider } from "./design-system-provider";

/**
 * Lets the design system badge editors (which draw `<img src>`) show official badge ids: the
 * SVG renderer is loaded only when the list has one, and uploads keep going to the CDN.
 */
export function BadgeMediaProvider({ badges, children }: BadgeMediaProviderProps) {
  const [render, setRender] = useState<((badge: string) => string | undefined) | null>(null);
  const hasOfficial = badges.some((badge): boolean => isOfficialBadgeId(badge));

  useEffect(() => {
    if (!hasOfficial || render) return;
    let cancelled = false;
    import("@/lib/official-badge-url")
      .then((module) => {
        if (!cancelled) setRender(() => module.officialBadgeDataUrl);
      })
      // ponytail: a failed chunk only leaves the official badge without a picture in the editor;
      // the list itself (and saving it) is untouched.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hasOfficial, render]);

  const resolveMediaUrl = useCallback(
    (url: string | null | undefined): string | undefined =>
      url && isOfficialBadgeId(url) ? render?.(url) : resolveCdnUrl(url),
    [render],
  );

  return <DesignSystemProvider resolveMediaUrl={resolveMediaUrl}>{children}</DesignSystemProvider>;
}
