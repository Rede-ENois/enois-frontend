/** Resultado da exclusão administrativa (DELETE /admin/moderation/{communities|groups}/{id}). */
export type AdminEntityDeletion = {
  id: string;
  name: string;
  /** DELETED (comunidade e grupo apagados) ou CLOSED (grupo encerrado sem apagar conteúdo). */
  outcome: "DELETED" | "CLOSED";
  affectedMembers: number;
  ownerId: string;
  adminWasMember: boolean;
  /** Quantas publicações saíram junto (só na exclusão física de grupo; 0 nos demais casos). */
  removedPosts: number;
};
