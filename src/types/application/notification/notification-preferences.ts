/** `GET/PUT /me/notification-preferences`: o que chega à pessoa fora do app. */
export type NotificationPreferences = {
  weeklyDigest: boolean;
  pushSocial: boolean;
  pushMessages: boolean;
  pushGroups: boolean;
  pushJobs: boolean;
  pushSystem: boolean;
  updatedAt: string | null;
};
