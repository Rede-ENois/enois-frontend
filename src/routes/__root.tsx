import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { texts } from "@/texts";

import { OAuthCallbackHandler } from "@/components/root/oauth-callback-handler";
import { RootError } from "@/components/root/root-error";
import { RootNotFound } from "@/components/root/root-not-found";
import { RootShell } from "@/components/root/root-shell";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: texts.root.seo.title },
      { name: "description", content: texts.root.seo.description },
      { property: "og:title", content: texts.root.seo.title },
      { property: "og:description", content: texts.root.seo.ogDescription },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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
  notFoundComponent: RootNotFound,
  errorComponent: RootError,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <OAuthCallbackHandler />
      <Outlet />
    </QueryClientProvider>
  );
}
