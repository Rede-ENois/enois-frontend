/** Advertência administrativa de uma conta (POST /admin/moderation/users/{username}/warnings). */
export type AdminWarningView = {
  id: string;
  userId: string;
  adminId: string;
  /** @ do administrador que aplicou (nulo só se a conta saiu do ar). */
  adminUsername: string | null;
  adminName: string | null;
  reason: string;
  createdAt: string;
  active: boolean;
  /** Quantas advertências ativas a conta acumulou depois desta decisão. */
  activeCount: number;
  revokedAt: string | null;
  revokedBy: string | null;
};
