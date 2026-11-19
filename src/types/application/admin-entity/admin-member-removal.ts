/** Resultado da remoção administrativa de um membro. */
export type AdminMemberRemoval = {
  entityId: string;
  userId: string;
  /** Papel que a pessoa tinha antes de sair. */
  role: string;
  outcome: "REMOVED";
};
