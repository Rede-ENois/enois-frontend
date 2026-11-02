/**
 * Módulo de cada área da interface — o mesmo identificador que o backend valida.
 *
 * EVENTOS controla também o "Acontecendo agora" (dependência única do plano): desativar
 * eventos desativa a área ao vivo na experiência pessoal.
 */
export const MODULE_PATHS: { prefix: string; module: string }[] = [
  { prefix: "/comunidades", module: "COMMUNITIES" },
  { prefix: "/grupos", module: "GROUPS" },
  { prefix: "/mensagens", module: "MESSAGES" },
  { prefix: "/blogs", module: "BLOGS" },
  { prefix: "/blog", module: "BLOGS" },
  { prefix: "/vagas", module: "JOBS" },
  { prefix: "/empresas", module: "COMPANIES" },
  { prefix: "/mentoria", module: "MENTORING" },
  { prefix: "/eventos", module: "EVENTS" },
  { prefix: "/acontecendo", module: "EVENTS" },
  { prefix: "/jogos-diarios", module: "DAILY_GAMES" },
  { prefix: "/games", module: "COMMUNITY_GAMES" },
  { prefix: "/projetos", module: "COMMUNITY_PROJECTS" },
  { prefix: "/par-de-estudo", module: "STUDY_PAIRS" },
];

/** Módulo dono de um caminho, ou null quando a rota não pertence a um módulo desativável. */
export function moduleForPath(pathname: string): string | null {
  const match = MODULE_PATHS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.module ?? null;
}
