/** `GET/PUT /me/notification-preferences`: entrega de avisos, assinaturas e resumo semanal. */
export type NotificationPreferences = {
  weeklyDigest: boolean;
  pushSocial: boolean;
  pushMessages: boolean;
  pushGroups: boolean;
  pushJobs: boolean;
  pushSystem: boolean;
  /** O aviso nem nasce: reações (post e comentário) somem da caixa e do push. */
  muteReactions: boolean;
  /** O aviso de comentário no post nem nasce; resposta ao seu comentário e menção continuam. */
  mutePostComments: boolean;
  /** Ausente em um backend anterior à assinatura de projetos. */
  communityProjects?: boolean;
  updatedAt: string | null;
};
