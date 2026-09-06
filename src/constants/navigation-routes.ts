import type { RouteDefinition } from "@/types/navigation/route-definition";

export const routeDefinitions = [
  { source: "feed/posts", to: "/feed" },
  { source: "users", to: "/perfil/$username", params: ["username"] },
  {
    source: "communities",
    to: "/comunidades/$communityId",
    params: ["communityId"],
  },
  { source: "jobs", to: "/vagas" },
  { source: "events", to: "/eventos" },
  { source: "mentors", to: "/mentoria" },
  { source: "perfil", to: "/perfil/$username", params: ["username"] },
  {
    source: "comunidades",
    to: "/comunidades/$communityId",
    params: ["communityId"],
  },
  { source: "feed", to: "/feed" },
  { source: "rede", to: "/rede" },
  { source: "mensagens", to: "/mensagens" },
  { source: "vagas", to: "/vagas" },
  { source: "eventos", to: "/eventos" },
  { source: "mentoria", to: "/mentoria" },
] as const satisfies readonly RouteDefinition[];
