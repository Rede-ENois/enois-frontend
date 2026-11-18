/** Uma pessoa da lista administrativa de membros (GET /admin/moderation/{...}/members). */
export type AdminMemberRow = {
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  /** ADMIN | MEMBER numa comunidade; OWNER | ADMIN | MODERATOR | MEMBER num grupo. */
  role: string;
  joinedAt: string;
};
