export type ListJobsParams = {
  query?: string;
  type?: string;
  level?: string;
  location?: string;
  skills?: string;
  /** A aba: INTERNAL (Énóis) ou EXTERNAL (agregadores) — sem o campo, mistura na 1a página. */
  source?: "INTERNAL" | "EXTERNAL";
  /** O filtro de agregador da aba externas. */
  platform?: string;
  /** Modelo de trabalho da vaga externa: REMOTE, HYBRID ou ONSITE. */
  workModel?: string;
  /** Vínculo da vaga externa: CLT, PJ, INTERNSHIP, FREELANCE... */
  employmentType?: string;
  /** Cidade da vaga externa. */
  city?: string;
  /** Estado (UF) da vaga externa. */
  state?: string;
  /** País da vaga externa. */
  country?: string;
  /** Piso salarial: vagas cuja faixa máxima fica abaixo disso não voltam. */
  salaryMin?: number;
  /** Só as que declaram trabalho remoto. */
  remoteOnly?: boolean;
  /** Publicadas a partir desta data (ISO 8601). */
  publishedAfter?: string;
  /**
   * Ordenação da aba externas: `recent` (padrão), `salary` ou `relevance`. Só `recent` pagina:
   * nas outras a posição não é estável entre páginas.
   */
  sort?: "recent" | "salary" | "relevance";
  cursor?: string | null;
  limit?: number;
};
