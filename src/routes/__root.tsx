import { createRootRouteWithContext } from "@tanstack/react-router";

import type { RootRouteContext } from "@/types/routes/root/root-route-context";
import { createRootRouteHead } from "@/utils/routes/create-root-route-head";

import { RootComponent } from "@/components/pages/root-component";
import { RootError } from "@/components/root-error";
import { RootNotFound } from "@/components/root-not-found";
import { RootShell } from "@/components/root-shell";

export const Route = createRootRouteWithContext<RootRouteContext>()({
  head: createRootRouteHead,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: RootNotFound,
  errorComponent: RootError,
});
