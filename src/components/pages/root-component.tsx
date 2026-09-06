import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useRouteContext } from "@tanstack/react-router";

import { OAuthCallbackHandler } from "@/components/oauth-callback-handler";

export function RootComponent() {
  const { queryClient } = useRouteContext({ from: "__root__" });

  return (
    <QueryClientProvider client={queryClient}>
      <OAuthCallbackHandler />
      <Outlet />
    </QueryClientProvider>
  );
}
