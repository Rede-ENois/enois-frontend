/** O que a tela de vagas tem selecionado, antes de virar parâmetro de busca. */
export type JobFilterInput = {
  aba: "enois" | "externas" | "salvas";
  query: string;
  level: string;
  location: string;
  type: string;
  skills: string;
  /** Vínculo fixo da aba (ex.: Freelance), que vence o filtro escolhido. */
  lockedType?: "FREELANCE" | null;
};
