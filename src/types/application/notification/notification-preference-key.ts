import type { NotificationPreferences } from "./notification-preferences";

/** Chaves persistidas pela API, incluindo a assinatura opcional de projetos. */
export type NotificationPreferenceKey = keyof Omit<NotificationPreferences, "updatedAt">;
