/** Ficha administrativa de uma comunidade (GET /admin/moderation/communities/{id}). */
export type AdminCommunityOverview = {
  id: string;
  name: string;
  ownerId: string;
  members: number;
  admins: number;
};
