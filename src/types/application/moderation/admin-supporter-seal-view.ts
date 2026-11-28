/**
 * Resposta do selo de apoiador registrado à mão pela administração
 * (`POST /admin/doacoes/sele/{username}`).
 *
 * A linha da doação registrada vem em `doacao` — valor zero e `origem: "MANUAL"`, porque o selo
 * manual não é dinheiro lido. O corpo é o mesmo do `adminView` das outras rotas administrativas.
 */
export type AdminSupporterSealView = {
  doacao: {
    id: string;
    txid: string;
    amountCents: number;
    status: "ABERTA" | "CONFIRMADA" | "RECUSADA";
    origem: string;
    userId: string;
    createdAt: string;
    confirmedAt: string;
  };
};
