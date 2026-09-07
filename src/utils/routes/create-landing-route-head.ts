import { texts } from "@/texts";

export function createLandingRouteHead() {
  return {
    meta: [
      { title: texts.landing.seo.title },
      { name: "description", content: texts.landing.seo.description },
      { property: "og:title", content: texts.landing.seo.title },
      { property: "og:description", content: texts.landing.seo.ogDescription },
    ],
  };
}
