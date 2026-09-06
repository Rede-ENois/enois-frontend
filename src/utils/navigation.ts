import type { Navigate } from "@/types/application/navigation/navigate";
import type { RouteDefinition } from "@/types/application/navigation/route-definition";

const routeDefinitions = [
  { source: "feed/posts", to: "/feed" },
  { source: "users", to: "/perfil/$username", params: ["username"] },
  { source: "communities", to: "/comunidades/$communityId", params: ["communityId"] },
  { source: "jobs", to: "/vagas" },
  { source: "events", to: "/eventos" },
  { source: "mentors", to: "/mentoria" },
  { source: "perfil", to: "/perfil/$username", params: ["username"] },
  { source: "comunidades", to: "/comunidades/$communityId", params: ["communityId"] },
  { source: "feed", to: "/feed" },
  { source: "rede", to: "/rede" },
  { source: "mensagens", to: "/mensagens" },
  { source: "vagas", to: "/vagas" },
  { source: "eventos", to: "/eventos" },
  { source: "mentoria", to: "/mentoria" },
] as const satisfies readonly RouteDefinition[];

const routes = [...routeDefinitions].sort((a, b) => b.source.length - a.source.length);

export function navigateToHref(href: string, navigate: Navigate) {
  const path = href.replace(/^\/api\//, "").replace(/^\/+|\/+$/g, "");
  const route = routes.find(({ source }) => path === source || path.startsWith(`${source}/`));
  if (!route) return;

  const values = path.slice(route.source.length).split("/").filter(Boolean);
  const paramNames = "params" in route ? route.params : [];
  if (values.length < paramNames.length) return;

  const params = Object.fromEntries(paramNames.map((name, index) => [name, values[index]]));
  navigate({ to: route.to, ...(paramNames.length > 0 ? { params } : {}) });
}
