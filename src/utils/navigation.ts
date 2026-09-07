import { routeDefinitions } from "@/constants/navigation-routes";
import type { Navigate } from "@/types/navigation/navigate";

const routes = [...routeDefinitions].sort((a, b) => b.source.length - a.source.length);

export function navigateToHref(href: string, navigate: Navigate) {
  const path = href.replace(/^\/api\//, "").replace(/^\/+|\/+$/g, "");
  const route = routes.find(({ source }) => path === source || path.startsWith(`${source}/`));

  if (!route) return;

  const values = path.slice(route.source.length).split("/").filter(Boolean);
  const paramNames = "params" in route ? route.params : [];

  if (values.length < paramNames.length) return;

  const params = Object.fromEntries(paramNames.map((name, index) => [name, values[index]]));

  navigate({
    to: route.to,
    ...(paramNames.length > 0 ? { params } : {}),
  });
}
