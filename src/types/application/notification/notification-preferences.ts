/** `GET/PUT /me/notification-preferences`: o que chega à pessoa fora do app. */
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
  updatedAt: string | null;
};
