import { useEffect, useState } from "react";

import { useRouterState } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { BeforeInstallPromptEvent } from "@/types/components/install-pwa/before-install-prompt-event";
import { Download, Share, X } from "lucide-react";

import { hasSession } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <>
      {showBanner && eligible && engaged && (
        <aside
          aria-label={texts.pwa.install.ariaLabel}
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border-soft bg-surface-card p-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-8"
        >
          <div className="flex items-center gap-3">
            <img src="/icons/brand-icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-strong">{texts.pwa.install.title}</p>

              <p className="text-xs font-normal text-text-subtle">
                {texts.pwa.install.description}
              </p>
            </div>

            <Button size="sm" onClick={install} aria-label={texts.pwa.install.ariaLabel}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {texts.pwa.install.action}
            </Button>

            <button
              type="button"
              onClick={closeBanner}
              aria-label={texts.pwa.install.close}
              title={texts.pwa.install.close}
              className="flex shrink-0 items-center justify-center rounded-md p-1 text-text-subtle transition hover:text-text-strong"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      <Dialog open={showIOSSteps} onOpenChange={(open) => !open && closeIOSSteps()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{texts.pwa.install.iosTitle}</DialogTitle>

            <DialogDescription>{texts.pwa.install.iosIntro}</DialogDescription>
          </DialogHeader>

          <ol className="list-decimal space-y-3 pl-5 text-sm font-normal text-text-subtle">
            <li>
              {texts.pwa.install.iosStepShareBefore}{" "}
              <strong className="text-text-strong">
                {texts.pwa.install.iosShare}
                <Share className="mx-1 inline h-4 w-4 align-middle" aria-hidden="true" />
              </strong>
              {texts.pwa.install.iosStepShareAfter}
            </li>

            <li>
              {texts.pwa.install.iosStepAddBefore}{" "}
              <strong className="text-text-strong">{texts.pwa.install.iosAddToHome}</strong>.
            </li>

            <li>
              {texts.pwa.install.iosStepConfirmBefore}{" "}
              <strong className="text-text-strong">{texts.pwa.install.iosAdd}</strong>{" "}
              {texts.pwa.install.iosStepConfirmAfter}
            </li>
          </ol>

          <Button onClick={closeIOSSteps}>{texts.pwa.install.iosOk}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
