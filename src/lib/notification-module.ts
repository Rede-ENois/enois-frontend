import type { NotificationModule } from "@/types/application/notification/notification-module";

/**
 * A qual módulo pertence uma notificação — para a personalização valer também aqui.
 *
 * "O que não quero ver" desativa módulos na experiência pessoal; se a notificação de um
 * módulo desativado continuasse aparecendo, o menu esconderia a área e o sino a traria de
 * volta. `null` = notificação de área que não é desativável (rede, publicações).
 *
 * The backend resolves the module (`Notification.module`); the kind table below only covers a
 * backend older than that field. Its old keys (`event`, `job`) never matched the real kinds
 * (EVENT_NEXT_OCCURRENCE, JOB_APPLICATION_STATUS), so those modules leaked into the bell.
 */
const MODULE_BY_KIND: Record<string, string> = {
  message: "MESSAGES",
  new_message: "MESSAGES",
  new_work_message: "MESSAGES",
  event: "EVENTS",
  event_next_occurrence: "EVENTS",
  job: "JOBS",
  job_application_status: "JOBS",
  company_new_opportunity: "JOBS",
  microprojeto: "COMPANIES",
  mentoring: "MENTORING",
  jogo_diario: "DAILY_GAMES",
  new_game: "COMMUNITY_GAMES",
  new_community_project: "COMMUNITY_PROJECTS",
  new_blog_post: "BLOGS",
};

/** Backend areas that are not a module the person can turn off. */
const NOT_A_MODULE: ReadonlySet<NotificationModule> = new Set(["NETWORK", "OTHER"]);

/** Tipos de grupo chegam com prefixo (`group_*`, `new_group_*`): o módulo é o mesmo. */
export function moduleForNotification(kind: string, module?: NotificationModule): string | null {
  if (module) return NOT_A_MODULE.has(module) ? null : module;
  if (!kind) return null;
  // O backend manda o tipo em MAIÚSCULAS (NEW_COMMENT); o front normaliza para minúsculas.
  const normalized = kind.toLowerCase();
  if (MODULE_BY_KIND[normalized]) return MODULE_BY_KIND[normalized];
  if (normalized.startsWith("group_") || normalized.startsWith("new_group_")) return "GROUPS";
  // STUDY_PAIR_MATCHED, _CHECKIN, _ENDED and _REMINDER.
  if (normalized.startsWith("study_pair_")) return "STUDY_PAIRS";
  return null;
}

export function isNotificationHidden(
  notification: { kind: string; module?: NotificationModule },
  disabledModules: ReadonlySet<string>,
): boolean {
  const module = moduleForNotification(notification.kind, notification.module);
  return module !== null && disabledModules.has(module);
}
