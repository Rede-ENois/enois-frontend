/** Estado de um nó da rede cooperativa, como o backend o devolve. */
export type NetworkNodeStatus =
  "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "QUARANTINED" | "REVOKED";
