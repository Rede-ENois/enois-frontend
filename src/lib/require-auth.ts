import { redirect } from "@tanstack/react-router";

/**
 * Rotas que exigem sessao. Precisa espelhar o `beforeLoad: requireAuth` declarado nas rotas:
 * o guard de rota roda no SSR, onde nao existe localStorage, entao quem abre uma URL protegida
 * direto (deep link / aba restaurada) precisa ser barrado no cliente — ver o guard em __root.tsx.
 *
 * Ficam de fora, de proposito: `/perfil/$username` e `/post/$postId` (destino de link compartilhado),
 * `/vagas` — a API de vagas e publica, entao listar e abrir uma vaga nao pode exigir sessao — e
 * `/comunidades` (listar e abrir comunidade e publico: o feed, os membros e o post fixado respondem
 * para visitante; as acoes de escrever continuam exigindo conta no proprio clique).
 * Sem isso, quem estava com a sessao vencida era jogado no login ao tentar abrir a propria vaga.
 * As telas do dono (`/vagas/minhas`, `/vagas/$jobId/candidaturas`) continuam exigindo sessao pelo
 * `beforeLoad` da propria rota. Perfil e publicacao sao conteudo publico — quem recebe o link precisa abrir
 * como visitante. As acoes que exigem conta (conectar, mensagem, reagir, comentar) ja passam por
 * `requireAuth()` e mandam para o login.
 */
const PROTECTED_ROUTES = [
  // "/jogos-diarios" saiu de proposito: a rota virou um redirecionamento para a categoria
  // diaria dentro de /games, e o proprio painel e que pede a conta.
  "/feed",
  "/rede",
  "/salvos",
  "/mensagens",
  "/suporte",
  "/bloqueados",
  "/seguranca",
];

export function hasSession(): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(localStorage.getItem("session_token"));
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Usado no `beforeLoad` das rotas: redireciona para o login quando nao ha sessao no cliente. */
export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("session_token")) {
    throw redirect({ to: "/entrar", search: { tab: "login" } });
  }
}
