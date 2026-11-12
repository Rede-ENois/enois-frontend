/**
 * O que a fonte externa informou de estruturado. Campo nulo = a fonte não informou; nada aqui é
 * inferido pelo Énóis.
 */
export type JobExternalDetails = {
  /** Quando a vaga foi publicada na origem. */
  publishedAt?: string | null;
  /** Última verificação de que a vaga ainda existe na origem. */
  lastSeenAt?: string | null;
  /** Vínculo: CLT, PJ, INTERNSHIP, FREELANCE... */
  employmentType?: string | null;
  /** Senioridade: JUNIOR, MID, SENIOR, LEAD. */
  level?: string | null;
  /** REMOTE, HYBRID ou ONSITE. */
  workModel?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  salaryMinAmount?: number | null;
  salaryMaxAmount?: number | null;
  salaryCurrency?: string | null;
  salaryPeriodCode?: string | null;
  /** Link de atribuição exigido pela fonte, quando houver. */
  attributionUrl?: string | null;
  /** Quando a fonte declara que a vaga expira. */
  expiresAt?: string | null;
  /** Quando a vaga saiu do ar na origem (não aparece mais na busca). */
  removedAt?: string | null;
};
