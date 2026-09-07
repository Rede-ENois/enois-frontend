import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";

export function createProfileRouteHead(user?: Profile) {
  return {
    meta: [
      { title: texts.profile.seoTitle(user?.name ?? texts.profile.seoFallbackTitle) },
      {
        name: "description",
        content: user?.headline ?? texts.profile.seoFallbackDescription,
      },
    ],
  };
}
