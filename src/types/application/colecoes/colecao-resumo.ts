/** Coleção é privada: só o dono a vê, então não há autor exposto — a contagem basta. */
export type ColecaoResumo = {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  createdAt: string;
};
