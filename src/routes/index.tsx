import { createFileRoute } from "@tanstack/react-router";

import { createLandingRouteHead } from "@/utils/routes/create-landing-route-head";

import { Landing } from "@/components/pages/landing-page";

export const Route = createFileRoute("/")({
  head: createLandingRouteHead,
  component: Landing,
});
