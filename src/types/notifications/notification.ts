export type Notification = {
  id: string;
  kind: string;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  ctaLabel: string;
};
