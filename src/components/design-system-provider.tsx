import { Link } from "@tanstack/react-router";

import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { EnoisProvider, type LinkProps } from "@rede-enois/design-system";

import { isOwnMediaUrl, resolveCdnUrl, withImageKitOriginal } from "@/lib/api/media";

/** Design system links navigate through the router; anything outside the app stays a plain anchor. */
function RouterLink({ href, ...props }: LinkProps) {
  if (!href.startsWith("/")) return <a href={href} {...props} />;
  // The router takes the query string apart from the path ("/entrar?tab=login").
  const [to, query] = href.split("?");
  if (query)
    return <Link to={to} search={Object.fromEntries(new URLSearchParams(query))} {...props} />;
  return <Link to={href} {...props} />;
}

/** Plugs the app's router and media CDN into the design system components. */
export function DesignSystemProvider({ children }: WithRequiredChildren) {
  return (
    <EnoisProvider
      Link={RouterLink}
      resolveMediaUrl={resolveCdnUrl}
      resolveMediaOriginalUrl={withImageKitOriginal}
      isOwnMediaUrl={isOwnMediaUrl}
    >
      {children}
    </EnoisProvider>
  );
}
