import { useEffect, useState } from "react";

import { useRouterState } from "@tanstack/react-router";

import type { BeforeInstallPromptEvent } from "@/types/components/install-pwa/before-install-prompt-event";
import { InstallPwaBanner as InstallPwaBannerView } from "@rede-enois/design-system/domain";

import { hasSession } from "@/lib/require-auth";

/** Quem fecha o convite não vê de novo até abrir outra aba/sessão. */
const SILENCED_KEY = "connect-grow-pwa-banner-silenced";
/** Só convida depois de um tempo de uso: instalar algo que a pessoa acabou de abrir não convence. */
const ENGAGEMENT_DELAY_MS = 30_000;
/** Telas de entrada e de leitura, onde o convite atrapalha. A raiz conta só exata. */
const HIDDEN_ROUTES = ["/entrar", "/auth", "/termos", "/privacidade", "/diretrizes"];

function isHiddenPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

function isSilenced(): boolean {
  try {
    return sessionStorage.getItem(SILENCED_KEY) === "true";
  } catch {
    return false;
  }
}

function silence(): void {
  try {
    sessionStorage.setItem(SILENCED_KEY, "true");
  } catch {
    // Sem storage (aba privada) o convite só volta no próximo carregamento.
  }
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Convite para instalar o app.
 *
 * Chrome/Edge/Android disparam `beforeinstallprompt` quando o PWA é instalável; seguramos o evento e
 * mostramos o nosso banner no lugar do mini-infobar. O Safari do iOS não tem esse evento nem prompt
 * nativo, então lá o botão abre o passo a passo do "Adicionar à Tela de Início".
 */
export function InstallPwaBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [engaged, setEngaged] = useState(false);
  // Fica montado em toda rota para não perder o `beforeinstallprompt` (ele dispara uma vez só), mas
  // só aparece para quem tem conta e está dentro do app.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const eligible = hasSession() && !isHiddenPath(pathname);

  useEffect(() => {
    if (!eligible || engaged) return;
    const timer = setTimeout(() => setEngaged(true), ENGAGEMENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, engaged]);

  useEffect(() => {
    // Em dev não há service worker, então o navegador nunca dispara `beforeinstallprompt`.
    // `?pwa=1` força o banner (e `?pwa=ios` o fluxo do iPhone) só para ver o layout.
    if (import.meta.env.DEV) {
      const forced = new URLSearchParams(window.location.search).get("pwa");
      if (forced) {
        setIsIOS(forced === "ios");
        setShowBanner(true);
        setEngaged(true);
        return;
      }
    }

    if (isStandaloneMode() || isSilenced()) return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      // O Chrome pode disparar o evento de novo depois do X.
      if (isSilenced()) return;
      setPromptEvent(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    const handleInstalled = () => {
      setShowBanner(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) {
      setIsIOS(true);
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      // O evento só vale para um prompt; se ainda couber, o Chrome dispara outro depois.
      setPromptEvent(null);
      if (outcome === "accepted") setShowBanner(false);
    } else if (isIOS) {
      setShowBanner(false);
      setShowIOSSteps(true);
    }
  };

  const closeBanner = () => {
    setShowBanner(false);
    silence();
  };

  const closeIOSSteps = () => {
    setShowIOSSteps(false);
    silence();
  };

  return (
    <InstallPwaBannerView
      showBanner={showBanner && eligible && engaged}
      onInstall={install}
      onClose={closeBanner}
      iosStepsOpen={showIOSSteps}
      onCloseIosSteps={closeIOSSteps}
    />
  );
}
