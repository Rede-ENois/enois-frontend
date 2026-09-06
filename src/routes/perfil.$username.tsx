import { createFileRoute, notFound } from "@tanstack/react-router";

import { profileApi } from "@/lib/api/profile";
import { texts } from "@/texts";

import { ProfileError } from "@/components/pages/profile-error";
import { ProfileNotFound } from "@/components/pages/profile-not-found";
import { Profile } from "@/components/pages/profile-page";

export const Route = createFileRoute("/perfil/$username")({
  loader: async ({ params }) => {
    try {
      const user = await profileApi.get(params.username);
      return { user };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: texts.profile.seoTitle(loaderData?.user.name ?? texts.profile.seoFallbackTitle) },
      {
        name: "description",
        content: loaderData?.user.headline ?? texts.profile.seoFallbackDescription,
      },
    ],
  }),
  notFoundComponent: ProfileNotFound,
  errorComponent: ProfileError,
  component: Profile,
});
