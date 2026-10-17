import { createFileRoute } from "@tanstack/react-router";

import type { SitemapEntry } from "@/types/routes/seo/sitemap-entry";

/** Só páginas abertas sem sessão; as que exigem login ficam de fora (ver robots.txt). */
const ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: 1 },
  { path: "/vagas", changefreq: "daily", priority: 0.8 },
  { path: "/entrar", changefreq: "yearly", priority: 0.5 },
  { path: "/developers", changefreq: "monthly", priority: 0.5 },
  { path: "/contato", changefreq: "yearly", priority: 0.4 },
  { path: "/diretrizes", changefreq: "monthly", priority: 0.4 },
  { path: "/termos", changefreq: "yearly", priority: 0.3 },
  { path: "/privacidade", changefreq: "yearly", priority: 0.3 },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const urls = ENTRIES.map(
          ({ path, changefreq, priority }) =>
            `  <url>\n    <loc>${origin}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`,
        ).join("\n");
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
