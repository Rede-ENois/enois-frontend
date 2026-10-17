import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

const MANIFEST = {
  name: texts.brand.name,
  short_name: texts.brand.name,
  description:
    "Rede profissional para conexões autênticas: vagas, mentoria, comunidades e eventos.",
  lang: "pt-BR",
  dir: "ltr",
  start_url: "/feed",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#f9f8ff",
  theme_color: texts.pwa.themeColor,
  categories: ["social", "business", "productivity"],
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(MANIFEST), {
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        }),
    },
  },
});
