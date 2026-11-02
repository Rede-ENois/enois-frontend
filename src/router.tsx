import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { PageSkeleton } from "@/components/skeletons/page-skeleton";

import { readCspNonce } from "./lib/csp";
import { createAppQueryClient, registerBrowserQueryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = createAppQueryClient();
  registerBrowserQueryClient(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // One provider for the whole tree: the root shell, pending, notFound and error components all
    // render outside the RootComponent, and any `useQuery` there (the app shell has several) took the
    // SSR down with "No QueryClient set".
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Rota lenta (internet fraca, loader demorado): mostra a casca com skeleton em vez de deixar
    // a tela anterior congelada. 400ms (e não o default de 1s) para o skeleton chegar antes de a
    // pessoa achar que o clique não pegou; o mínimo de 300ms segura o skeleton em loaders oscilantes.
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 400,
    defaultPendingMinMs: 300,
    // Stamps the request's CSP nonce on every inline script the router renders (see lib/csp.ts).
    ssr: { nonce: readCspNonce() },
  });

  return router;
};
