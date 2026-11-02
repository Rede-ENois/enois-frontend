import type { NotificationModule } from "@/types/application/notification/notification-module";
import type { NotificationPlace } from "@/types/application/notification/notification-place";
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type Notification = {
  id: string;
  kind: string;
  /** Interface the notification belongs to; SHARED ones (security, moderation) show in both. */
  context?: "SOCIAL" | "PROFESSIONAL" | "SHARED";
  /** Area resolved by the backend; absent on a backend older than the unread summary. */
  module?: NotificationModule;
  /** CORPORATE: the actor is shown with their professional identity (name, @ and avatar). */
  actorIdentity?: "SOCIAL" | "CORPORATE";
  actorId: string | null;
  actorName: string | null;
  /** Username do ator — clique no nome/foto abre o perfil dele. */
  actorUsername: string | null;
  actorAvatar: string | null;
  /** Personalização do nome do ator (tema/fonte/cor); ausente = padrão. */
  actorStyle?: AuthorNameStyle | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  ctaLabel: string;
  /** The community or group it came from (absent on an older backend). */
  place?: NotificationPlace | null;
  /** Calendar day ("2026-11-02") of the event it is about. */
  eventDate?: string | null;
};
