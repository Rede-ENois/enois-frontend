/** O ritmo do ano: picos (null quando não houve) e a série dos gráficos. */
export type WrappedRitmo = {
  diaSemanaMaisAtivo: number | null;
  horaMaisAtiva: number | null;
  mesMaisAtivo: number | null;
  porMes: number[];
  porDiaSemana: number[];
  porHora: number[];
  comportamento: {
    porTrimestre: number[];
    sentido: "CRESCEU" | "DESACELEROU" | "ESTAVEL";
  };
};
