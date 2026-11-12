/** Um registro do histórico administrativo do nó, como `GET /admin/network/nodes/{id}/history` o devolve. */
export type NetworkAuditRecord = {
  id: string;
  actorId: string;
  action: string;
  metadata: string | null;
  createdAt: string;
};
