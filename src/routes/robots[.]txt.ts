import { createFileRoute } from "@tanstack/react-router";

/** Áreas que pedem sessão ou não têm valor de busca: o rastreador só encontraria o login. */
const DISALLOWED_PATHS = [
  "/auth/",
  "/bloqueados",
  "/comunidades",
  "/denuncias",
  "/eventos",
  "/feed",
  "/mensagens",
  "/mentoria",
  "/moderacao",
  "/penalidades",
  "/rede",
  "/salvos",
  "/seguranca",
  "/suporte",
  "/vagas/minhas",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const body = [
          "User-agent: *",
          "Allow: /",
          ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
