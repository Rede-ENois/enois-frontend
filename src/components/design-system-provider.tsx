import { Link } from "@tanstack/react-router";

import { usePreferencesStore } from "@/stores/preferences.store";
import type { DesignSystemProviderProps } from "@/types/components/design-system-provider-props";
import { EnoisProvider, type LinkProps } from "@rede-enois/design-system";

import { isOwnMediaUrl, resolveCdnUrl, withImageKitOriginal } from "@/lib/api/media";
import { clearFeedScroll } from "@/lib/feed-scroll-restoration";
import { appPathOf } from "@/lib/link-preview/paths";

/** Design system links navigate through the router; anything outside the app stays a plain anchor. */
function RouterLink({ href, onClick, ...props }: LinkProps) {
  if (!href.startsWith("/")) return <a href={href} onClick={onClick} {...props} />;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Já está na rota: o router não navega, então faz scroll pro topo manualmente.
    // Limpa o scroll restoration do feed para o effect não restaurar a posição antiga.
    // startsWith cobre trailing slash de proxies. requestAnimationFrame garante que o
    // scroll roda depois do router processar o clique.
    const [path] = href.split("?");
    if (typeof window !== "undefined" && window.location.pathname.startsWith(path)) {
      clearFeedScroll();
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
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
  // Preferência salva neste dispositivo: com ela ligada, mídia sensível nasce revelada em
  // tudo que é desenhado pelo design system (feed, perfil, colagem).
  const revealSensitiveMedia = usePreferencesStore((state) => state.revealSensitiveMedia);
  return (
    <EnoisProvider
      Link={RouterLink}
      resolveMediaUrl={resolveMediaUrl ?? resolveCdnUrl}
      resolveMediaOriginalUrl={withImageKitOriginal}
      isOwnMediaUrl={isOwnMediaUrl}
      appPathOf={appPathOf}
      revealSensitiveMedia={revealSensitiveMedia}
    >
      {children}
    </EnoisProvider>
  );
}
