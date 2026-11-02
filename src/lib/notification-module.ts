/**
 * A qual módulo pertence uma notificação — para a personalização valer também aqui.
 *
 * "O que não quero ver" desativa módulos na experiência pessoal; se a notificação de um
 * módulo desativado continuasse aparecendo, o menu esconderia a área e o sino a traria de
 * volta. `null` = notificação de área que não é desativável (rede, publicações).
 */
const MODULE_BY_KIND: Record<string, string> = {
  message: "MESSAGES",
  new_message: "MESSAGES",
  new_work_message: "MESSAGES",
  event: "EVENTS",
  job: "JOBS",
  company_new_opportunity: "JOBS",
  mentoring: "MENTORING",
  jogo_diario: "DAILY_GAMES",
};

/** Tipos de grupo chegam com prefixo (`group_*`, `new_group_*`): o módulo é o mesmo. */
export function moduleForNotification(kind: string): string | null {
  if (!kind) return null;
  // O backend manda o tipo em MAIÚSCULAS (NEW_COMMENT); o front normaliza para minúsculas.
  const normalized = kind.toLowerCase();
  if (MODULE_BY_KIND[normalized]) return MODULE_BY_KIND[normalized];
  if (normalized.startsWith("group_") || normalized.startsWith("new_group_")) return "GROUPS";
  // STUDY_PAIR_MATCHED, _CHECKIN, _ENDED and _REMINDER.
  if (normalized.startsWith("study_pair_")) return "STUDY_PAIRS";
  return null;
}

export function isNotificationHidden(kind: string, disabledModules: ReadonlySet<string>): boolean {
  const module = moduleForNotification(kind);
  return module !== null && disabledModules.has(module);
}
