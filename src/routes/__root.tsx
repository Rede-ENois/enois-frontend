import { useEffect, useState } from "react";

import {
  type ErrorComponentProps,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";

import { texts } from "@/texts";
import type { WithRequiredChildren } from "@/types/components/with-required-children";
import type { PushNavigateMessage } from "@/types/push/push-navigate-message";
import type { RootRouteContext } from "@/types/routes/root/root-route-context";
import { navigateToHref } from "@/utils/navigation";
import { ToastProvider, buttonVariants } from "@rede-enois/design-system/ui";

import { useMarkPushRead } from "@/lib/notification-read-cache";
import { registerPushSubscription } from "@/lib/push";
import {
  hrefDaQueryDePush,
  hrefDoPush,
  notificationIdDoPush,
  searchSemPush,
  subscriptionDoPush,
} from "@/lib/push-navigation";
import { registerServiceWorker } from "@/lib/pwa";
import { hasSession, isProtectedPath, shouldLeaveLanding } from "@/lib/require-auth";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme-bootstrap";
import { useThemeSync } from "@/lib/theme/use-theme-sync";
import { useScrollDirection } from "@/lib/use-scroll-direction";
import { WEB_FONT_STYLESHEET } from "@/lib/web-fonts";

import { AgeGate } from "@/components/age-gate";
import { AppContainer } from "@/components/app-container";
import { CallsProvider } from "@/components/calls/calls-provider";
import { ChatDockMount } from "@/components/chat-dock/chat-dock-mount";
import { DesignSystemProvider } from "@/components/design-system-provider";
import { HealthyUsageGuard } from "@/components/healthy-usage/healthy-usage-guard";
import { InstallPwaBanner } from "@/components/install-pwa-banner";
import { LiteModeEffects } from "@/components/lite-mode-effects";
import { MessageStream } from "@/components/messages/message-stream";
import { ModuleDisabledGate } from "@/components/module-disabled-gate";
import { AdminNoticeDialog } from "@/components/notices/admin-notice";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { SkipLink } from "@/components/skip-link";
import { WhatsNewGate } from "@/components/whats-new/whats-new-gate";

import appCss from "../styles.css?url";

/**
 * 404 dentro da casca do app (cabeçalho e menu), e não numa página solta: quem caiu num link
 * quebrado continua com a navegação à mão. The design system provider comes along because the root
 * notFound replaces the whole RootComponent; react-query comes from the router `Wrap`.
 */
function NotFoundComponent() {
  return (
    <DesignSystemProvider>
      <AppContainer>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="text-7xl font-bold text-primary">{texts.root.notFound.code}</p>

            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {texts.root.notFound.title}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">{texts.root.notFound.description}</p>

            <div className="mt-6">
              <Link to="/" className={buttonVariants({ size: "lg" })}>
                {texts.root.notFound.home}
              </Link>
            </div>
          </div>
        </div>
      </AppContainer>
    </DesignSystemProvider>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {texts.root.error.title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">{texts.root.error.description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {texts.root.error.retry}
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {texts.root.error.home}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        // `interactive-widget` faz o layout encolher com o teclado em vez de rolar a página toda;
        // no chat, é o que mantém cabeçalho e mensagens no lugar e sobe só o campo de texto.
        content: "width=device-width, initial-scale=1, interactive-widget=resizes-content",
      },
      { title: texts.root.seo.title },
      {
        name: "description",
        content: texts.root.seo.description,
      },
      { property: "og:title", content: texts.root.seo.title },
      {
        property: "og:description",
        content: texts.root.seo.ogDescription,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: texts.pwa.themeColor },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: texts.brand.name },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      // As fontes do Google entram pelo script de arranque, e só quando o aparelho não está em
      // modo econômico: em BATATA a tipografia é a do sistema e o pedido nem sai. Sem JS, o
      // `<noscript>` do shell devolve o `<link>` de sempre (src/lib/web-fonts.ts).
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: WithRequiredChildren) {
  // Browsers blank the nonce attribute after parsing, so hydration would see a mismatch.
  const nonce = useRouter().options.ssr?.nonce;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Os dois ícones abrem o `<head>` de propósito: o `HeadContent` serializa antes a lista de
            `modulepreload` dos chunks antes do `head()` da rota. Assim o pedido do favicon sai logo
            nos primeiros bytes do documento. O `sizes` do `.ico` lista as quatro resoluções reais do contêiner. */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="icon"
          type="image/vnd.microsoft.icon"
          sizes="16x16 32x32 48x48 64x64"
          href="/favicon.ico"
        />
        <HeadContent />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        {/* Sem JS o script de arranque não roda: o `<link>` das fontes volta a ser fixo. */}
        <noscript>
          <link rel="stylesheet" href={WEB_FONT_STYLESHEET} />
        </noscript>
      </head>

      <body>
        <SkipLink />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // react-query comes from the router `Wrap` (src/router.tsx), around every root component.
  return (
    <DesignSystemProvider>
      <RootInsideProvider />
    </DesignSystemProvider>
  );
}

function RootInsideProvider() {
  const router = useRouter();
  const markPushRead = useMarkPushRead();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Lido uma vez, na montagem: o efeito de push apaga a query antes de navegar, e um segundo
  // passe (StrictMode) nao pode confundir "sem push" com "home de quem tem sessao".
  const [pushTargetAtLoad] = useState(() =>
    typeof window === "undefined" ? null : hrefDaQueryDePush(window.location.search),
  );

  useThemeSync();
  useScrollDirection();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    // A landing so aparece para visitante. O `beforeLoad` dela nao roda no SSR de um deep link,
    // entao quem reabre o site logado (e o proprio service worker) ve a home em vez do feed.
    // Declarado antes dos efeitos de push de proposito: eles consomem a query antes de navegar.
    if (shouldLeaveLanding(pathname, hasSession(), Boolean(pushTargetAtLoad))) {
      void router.navigate({ to: "/feed", replace: true });
    }
  }, [pathname, router, pushTargetAtLoad]);

  useEffect(() => {
    // Clique na notificacao PUSH: o service worker nao conhece as rotas do app (a tabela esta em
    // src/utils/navigation.ts), entao ele devolve o href para a aba traduzir. Sem isso, o worker
    // navegaria direto para o caminho de API que o backend manda ("/api/feed/posts/xxx") e o
    // clique abriria a API em vez do post.
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      // Inscricao renovada pelo worker: registra no backend para o envio nao ficar preso no
      // endpoint antigo (o navegador pode trocar a inscricao sozinho).
      const renewal = subscriptionDoPush(event.data);
      if (renewal) {
        void registerPushSubscription(renewal).catch(() => undefined);
        return;
      }
      const message = event.data as PushNavigateMessage | null;
      const href = hrefDoPush(message);
      if (!href) return;
      markPushRead(notificationIdDoPush(message));
      navigateToHref(href, (opts) => void router.navigate(opts));
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router, markPushRead]);

  useEffect(() => {
    // Clique na notificacao PUSH sem nenhuma aba do app aberta: o worker nao conhece as rotas,
    // entao deixa o href na query (`/?push=...`) e a traducao acontece aqui — pela mesma tabela
    // que a notificacao interna usa. Sem isso, um href que nao e rota do front
    // ("/configuracoes/seguranca") abria a pagina de erro.
    const href = hrefDaQueryDePush(window.location.search);
    if (!href) return;
    markPushRead(notificationIdDoPush(window.location.search));
    const resto = searchSemPush(window.location.search);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${resto ? `?${resto}` : ""}${window.location.hash}`,
    );
    navigateToHref(href, (opts) => void router.navigate(opts));
  }, [router, markPushRead]);

  useEffect(() => {
    // Fallback de autenticacao: o `beforeLoad` das rotas roda no SSR (sem acesso ao
    // localStorage) e nao e reexecutado na hidratacao, entao quem abre uma rota protegida
    // direto sem estar logado veria a UI autenticada e erros nas acoes. Aqui no cliente
    // mandamos para o login, seja qual for a forma de entrada.
    if (isProtectedPath(pathname) && !hasSession()) {
      void router.navigate({ to: "/entrar", search: { tab: "login" }, replace: true });
    }
  }, [pathname, router]);

  return (
    <ToastProvider>
      {/* Chamadas envolvem a casca: o overlay é interno (nunca uma aba nova) e as telas usam
          useCalls para começar/receber em qualquer página. */}
      <CallsProvider>
        <ModuleDisabledGate>
          <RouteErrorBoundary key={pathname} onReset={() => router.invalidate()}>
            <Outlet />
          </RouteErrorBoundary>
        </ModuleDisabledGate>

        <ChatDockMount />
        <MessageStream />
        <InstallPwaBanner />
        <LiteModeEffects />
        <HealthyUsageGuard />
        <OnboardingRedirect />
        <WhatsNewGate />
        <AgeGate />
        <AdminNoticeDialog />
      </CallsProvider>
    </ToastProvider>
  );
}
