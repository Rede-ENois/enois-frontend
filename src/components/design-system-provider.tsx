import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { DesignSystemProviderProps } from "@/types/components/design-system-provider-props";
import { EnoisProvider, type LinkProps } from "@rede-enois/design-system";

import { isOwnMediaUrl, resolveCdnUrl, withImageKitOriginal } from "@/lib/api/media";

/** Design system links navigate through the router; anything outside the app stays a plain anchor. */
function RouterLink({ href, onClick, ...props }: LinkProps) {
  if (!href.startsWith("/")) return <a href={href} onClick={onClick} {...props} />;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Já está na rota: o router não navega, então faz scroll pro topo manualmente.
    const [path] = href.split("?");
    if (typeof window !== "undefined" && window.location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // The router takes the query string apart from the path ("/entrar?tab=login").
  const [to, query] = href.split("?");
  if (query)
    return (
      <Link
        to={to}
        search={Object.fromEntries(new URLSearchParams(query))}
        onClick={handleClick}
        {...props}
      />
    );
  return <Link to={href} onClick={handleClick} {...props} />;
}

/** Plugs the app's router and media CDN into the design system components. */
export function DesignSystemProvider({ children, resolveMediaUrl }: DesignSystemProviderProps) {
  return (
    <EnoisProvider
      Link={RouterLink}
      resolveMediaUrl={resolveMediaUrl ?? resolveCdnUrl}
      resolveMediaOriginalUrl={withImageKitOriginal}
      isOwnMediaUrl={isOwnMediaUrl}
      messages={{
        pushToggle: {
          on: texts.account.menu.pushToggleOn,
          off: texts.account.menu.pushToggleOff,
          working: texts.account.menu.pushToggleWorking,
        },
      }}
    >
      {children}
    </EnoisProvider>
  );
}
