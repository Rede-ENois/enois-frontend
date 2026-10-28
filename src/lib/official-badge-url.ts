import { createElement } from "react";

import { OfficialBadge, isOfficialBadgeId } from "@rede-enois/design-system/domain";
import { renderToStaticMarkup } from "react-dom/server";

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';
const cache = new Map<string, string | undefined>();

/**
 * An official badge (`emblema-*`) as an image URL. The badge editors of the design system draw
 * every badge with `<img src>`, which is right for uploads and broken for an id; the SVG becomes
 * a data URL instead (its colors are inline, so it needs no stylesheet). It pulls in
 * `react-dom/server`, so only `BadgeMediaProvider` loads this module, on demand.
 */
export function officialBadgeDataUrl(badge: string): string | undefined {
  if (!isOfficialBadgeId(badge)) return undefined;
  if (cache.has(badge)) return cache.get(badge);
  const markup = renderToStaticMarkup(createElement(OfficialBadge, { badge }));
  const url = markup
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup.replace("<svg", `<svg ${SVG_NS}`))}`
    : undefined;
  cache.set(badge, url);
  return url;
}
