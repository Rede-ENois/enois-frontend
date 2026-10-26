import { useEffect } from "react";

import { useAppShellStore } from "@/stores/app-shell.store";
import { AppBrand } from "@rede-enois/design-system/domain";
import { NavigationDrawer as NavigationDrawerView } from "@rede-enois/design-system/patterns";

import { NavigationLinks } from "./navigation-links";

/** Opens and closes the design system drawer through the shell store. */
export function NavigationDrawer() {
  const mobileNavigationOpen = useAppShellStore((state) => state.mobileNavigationOpen);
  const closeMobileNavigation = useAppShellStore((state) => state.closeMobileNavigation);

  useEffect(() => {
    // Mesmo limite do `lg` do Tailwind (64rem): ao cruzar para o desktop, o drawer
    // fica escondido por CSS mas seguiria aberto no Radix, prendendo foco e scroll.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobileNavigation();
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [closeMobileNavigation]);

  return (
    <NavigationDrawerView
      open={mobileNavigationOpen}
      onClose={closeMobileNavigation}
      brand={<AppBrand href="/feed" onClick={closeMobileNavigation} />}
    >
      {/* `min-h-0` + `flex-1` é o que faz a lista rolar dentro do painel: sem isso ela cresce
          além da altura e o fim fica fora da tela. */}
      <NavigationLinks
        onNavigate={closeMobileNavigation}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
      />
    </NavigationDrawerView>
  );
}
