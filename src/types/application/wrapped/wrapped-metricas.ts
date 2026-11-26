/** As contagens do ano, como o backend entregou. */
export type WrappedMetricas = {
  publicacoes: number;
  comentariosProprios: number;
  reacoesRecebidas: number;
  comentariosRecebidos: number;
  compartilhamentosRecebidos: number;
  repostsRecebidos: number;
  reacoesFeitas: number;
  comentariosFeitos: number;
  compartilhamentosFeitos: number;
  repostsFeitos: number;
  votosFeitos: number;
  salvos: number;
  comunidadesParticipadas: number;
  diasAtivos: number;
  mesMaisAtivo: number | null;
};
