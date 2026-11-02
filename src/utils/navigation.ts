import type { Navigate } from "@/types/navigation/navigate";
import type { RouteDefinition } from "@/types/navigation/route-definition";

const routeDefinitions = [
  // Notificação de post (comentário/reacção/menção) leva ao post real.
  { source: "feed/posts", to: "/post/$postId", params: ["postId"] },
  // Notificação NEW_BLOG_POST vem como /blog/{slug}/{postId}; sem esta rota o clique não fazia nada.
  { source: "blog", to: "/blog/$username/$postId", params: ["username", "postId"] },
  { source: "users", to: "/perfil/$username", params: ["username"] },
  { source: "network", to: "/rede" },
  { source: "conversations", to: "/mensagens" },
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
  { source: "grupos", to: "/grupos/$slug", params: ["slug"] },
  // Notificações de moderação ("Abrir painel") e de jogo ("Ver") apontam para estas rotas.
  { source: "moderador", to: "/moderador" },
  // Marketplace: o pedido de desculpa de uma comunidade banida por engano.
  { source: "marketplace", to: "/marketplace" },
  // Seguranca: novo dispositivo e 2FA redefinido. O backend manda "/seguranca" e
  // "/configuracoes/seguranca" — sem estas entradas o clique na notificacao era MUdo (a pessoa
  // tocava e nada acontecia).
  { source: "seguranca", to: "/seguranca" },
  { source: "configuracoes", to: "/seguranca" },
  { source: "suporte", to: "/suporte" },
  { source: "diretrizes", to: "/diretrizes" },
  { source: "carteira", to: "/carteira" },
  { source: "games", to: "/games/$username/$gameSlug", params: ["username", "gameSlug"] },
  { source: "feed", to: "/feed" },
  { source: "rede", to: "/rede" },
  { source: "mensagens", to: "/mensagens" },
  // JOB_APPLICATION_STATUS manda "/vagas/{jobId}": abre a vaga; "/vagas" sozinho cai na lista abaixo.
  { source: "vagas", to: "/vagas/$jobId", params: ["jobId"] },
  { source: "vagas", to: "/vagas" },
  { source: "eventos", to: "/eventos" },
  { source: "mentoria", to: "/mentoria" },
  { source: "penalidades", to: "/penalidades" },
  // Study pair notifications (matched, check-in, ended, reminder) all point here.
  { source: "par-de-estudo", to: "/par-de-estudo" },
] as const satisfies readonly RouteDefinition[];

const routes = [...routeDefinitions].sort((a, b) => b.source.length - a.source.length);

export function navigateToHref(href: string, navigate: Navigate) {
  // The query string travels along (e.g. `/eventos?evento={id}` opens and highlights the event);
  // only the path picks the route. The base is a placeholder: hrefs are app-relative.
  const url = new URL(href, "https://app.invalid");
  const path = url.pathname.replace(/^\/api\//, "").replace(/^\/+|\/+$/g, "");
  const search = Object.fromEntries(url.searchParams);
  const hasSearch = Object.keys(search).length > 0;

  // Notificação de mensagem traz o id da conversa: abre ela direto, não só a lista.
  const conversation = path.match(/^conversations\/([^/]+)$/);
  if (conversation) {
    navigate({ to: "/mensagens", search: { conversation: conversation[1] } });
    return;
  }

  const valuesAfter = (source: string) => path.slice(source.length).split("/").filter(Boolean);
  // Mesma origem pode ter mais de uma rota (com e sem id): vale a primeira cujos parâmetros o href
  // preenche, então href incompleto cai na versão sem parâmetro ou em nenhuma.
  const route = routes.find(
    (candidate) =>
      (path === candidate.source || path.startsWith(`${candidate.source}/`)) &&
      valuesAfter(candidate.source).length >= ("params" in candidate ? candidate.params.length : 0),
  );

  if (!route) return;

  const values = valuesAfter(route.source);
  const paramNames = "params" in route ? route.params : [];

  const params = Object.fromEntries(paramNames.map((name, index) => [name, values[index]]));

  navigate({
    to: route.to,
    ...(paramNames.length > 0 ? { params } : {}),
    ...(hasSearch ? { search } : {}),
  });
}
