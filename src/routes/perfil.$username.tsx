import { createFileRoute } from "@tanstack/react-router";

import { createProfileRouteHead } from "@/utils/routes/create-profile-route-head";
import { loadProfileRoute } from "@/utils/routes/load-profile-route";

import { ProfileError } from "@/components/pages/profile-error";
import { ProfileNotFound } from "@/components/pages/profile-not-found";
import { Profile } from "@/components/pages/profile-page";

export const Route = createFileRoute("/perfil/$username")({
  loader: ({ params }) => loadProfileRoute(params.username),
  head: ({ loaderData }) => createProfileRouteHead(loaderData?.user),
  notFoundComponent: ProfileNotFound,
  errorComponent: ProfileError,
  component: Profile,
});
