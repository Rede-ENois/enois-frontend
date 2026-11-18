/** Ficha administrativa de um grupo (GET /admin/moderation/groups/{id}). */
export type AdminGroupOverview = {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
  status: string;
  members: number;
  admins: number;
};
