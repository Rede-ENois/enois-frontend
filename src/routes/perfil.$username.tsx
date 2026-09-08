import { createFileRoute } from "@tanstack/react-router";

import { createProfileRouteHead } from "@/utils/routes/create-profile-route-head";
import { loadProfileRoute } from "@/utils/routes/load-profile-route";

import { ProfilePageProvider } from "@/components/profile-page-provider";
import { ProfileError } from "@/components/pages/profile-error";
import { ProfileNotFound } from "@/components/pages/profile-not-found";

export const Route = createFileRoute("/perfil/$username")({
  loader: ({ params }) => loadProfileRoute(params.username),
  head: ({ loaderData }) => createProfileRouteHead(loaderData?.user),
  notFoundComponent: ProfileNotFound,
  errorComponent: ProfileError,
  component: ProfilePageProvider,
});
