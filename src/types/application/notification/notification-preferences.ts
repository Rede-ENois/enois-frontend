/** `GET/PUT /me/notification-preferences`: entrega de avisos, assinaturas e resumo semanal. */
export type NotificationPreferences = {
  weeklyDigest: boolean;
  pushSocial: boolean;
  pushMessages: boolean;
  pushGroups: boolean;
  pushJobs: boolean;
  pushSystem: boolean;
  /** Ausente em um backend anterior à assinatura de projetos. */
  communityProjects?: boolean;
  updatedAt: string | null;
};
