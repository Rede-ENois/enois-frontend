import { useEffect } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import {
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
import type { ErrorComponentProps } from "@/types/routes/root/error-component-props";
import type { RootRouteContext } from "@/types/routes/root/root-route-context";

import { registerServiceWorker } from "@/lib/pwa";
import { hasSession, isProtectedPath } from "@/lib/require-auth";
import { useThemeSync } from "@/lib/theme/use-theme-sync";

import { ToastProvider } from "@/components/ui/toast";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">{texts.root.notFound.code}</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">{texts.root.notFound.title}</h2>

        <p className="mt-2 text-sm text-muted-foreground">{texts.root.notFound.description}</p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {texts.root.notFound.home}
          </Link>
        </div>
      </div>
    </div>
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
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
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Aplica o tema guardado antes do primeiro paint.
 *
 * Sem isso o app nasce claro (e na cor padrão) e só depois de hidratar assume o
 * tema do usuário — aquele flash. O CSS já vem resolvido do `localStorage`, então
 * o script só injeta o texto, sem repetir a matemática de cor. A coleção temática
 * também entra aqui: o atributo `data-theme` precisa existir antes do paint,
 * porque o CSS estrutural do tema é escopado por ele.
 */
const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var raw=localStorage.getItem("connect-grow-preferences");
if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.theme==="dark"){document.documentElement.classList.add("dark");}}
var collection=localStorage.getItem("connect-grow-theme-collection");
if(collection){document.documentElement.setAttribute("data-theme",collection);}
var css=localStorage.getItem("connect-grow-theme-css");
if(css){var style=document.createElement("style");style.id="app-theme";style.textContent=css;document.head.appendChild(style);}
}catch(error){}})();`;

function RootShell({ children }: WithRequiredChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // O provider precisa ENVOLVER quem usa react-query: useThemeSync tem um useQuery
  // (tema da conta) e, fora daqui, derrubava o SSR de todas as paginas
  // ("No QueryClient set" — o RootComponent roda FORA do proprio provider).
  return (
    <QueryClientProvider client={queryClient}>
      <RootInsideProvider />
    </QueryClientProvider>
  );
}

function RootInsideProvider() {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useThemeSync();

  useEffect(() => {
    registerServiceWorker();
  }, []);

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
      <Outlet />
    </ToastProvider>
  );
}
