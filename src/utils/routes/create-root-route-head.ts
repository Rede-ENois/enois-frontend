import { texts } from "@/texts";

import appCss from "../../styles.css?url";

export function createRootRouteHead() {
  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: texts.root.seo.title },
      { name: "description", content: texts.root.seo.description },
      { property: "og:title", content: texts.root.seo.title },
      { property: "og:description", content: texts.root.seo.ogDescription },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap",
      },
    ],
  };
}
