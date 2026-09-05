import { createFileRoute, notFound } from "@tanstack/react-router";

import { profileApi } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileError } from "@/components/profile/page/profile-error";
import { ProfileNotFound } from "@/components/profile/page/profile-not-found";
import { ProfilePage } from "@/components/profile/page/profile-page";

export const Route = createFileRoute("/perfil/$username")({
  loader: async ({ params }) => {
    try {
      return { user: await profileApi.get(params.username) };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.user.name ?? texts.profile.seoFallbackTitle} · ${texts.brand.name}`,
      },
      {
        name: "description",
        content: loaderData?.user.headline ?? texts.profile.seoFallbackDescription,
      },
    ],
  }),
  notFoundComponent: ProfileNotFound,
  errorComponent: ProfileError,
  component: ProfileRoute,
});

function ProfileRoute() {
  const { user } = Route.useLoaderData();
  return <ProfilePage loaderUser={user} />;
}
