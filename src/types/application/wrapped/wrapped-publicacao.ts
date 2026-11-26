/** Uma publicação marcante, com autor e trecho (o container monta os links). */
export type WrappedPublicacao = {
  id: string;
  autorId: string | null;
  autorUsername: string | null;
  autorNome: string | null;
  trecho: string | null;
  motivo: "PROPRIA_ENGAJADA" | "PARTICIPACAO";
  metrica: number;
  dataIso: string;
};
