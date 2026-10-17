import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

/** @TODO humanstxt.org: quem faz o projeto. Mantenha a lista em dia quando alguém entrar no time. */
const TEAM = [
  "Sara Borges",
  "Melissa Monfre dos Santos",
  "Luiza Ferraz",
  "Nicolas Estanislau",
  "Rafael Brasileiro",
  "Lucas Frischeisen",
  "Carlos Daniel Sucre",
  "Mauro Domingues",
];

const STACK = [
  "React",
  "TanStack Start",
  "TanStack Router",
  "TanStack Query",
  "Tailwind CSS",
  "Radix UI",
  "TypeScript",
  "Vite",
];

export const Route = createFileRoute("/humans.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "/* TEAM */",
          ...TEAM.map((name) => `  Dev: ${name}`),
          "",
          "/* THANKS */",
          `  Todo mundo que constrói a ${texts.brand.name} com a gente.`,
          "",
          "/* SITE */",
          "  Language: Português (Brasil)",
          `  Standards: HTML5, CSS3, PWA`,
          `  Components: ${STACK.join(", ")}`,
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
