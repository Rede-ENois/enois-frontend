/** Uma pessoa com quem a conta mais se cruzou. */
export type WrappedInteracao = {
  userId: string;
  username: string;
  nome: string;
  vezes: number;
  tipo: "INTERAGI" | "INTERAGIRAM";
};
