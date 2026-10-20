import type { JobApplicationField } from "./job-application-field";
import type { JobAuthor } from "./job-author";

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  type: string;
  level: string;
  salary: string | null;
  /** Moeda da faixa salarial: BRL, USD ou EUR. */
  currency: string | null;
  skills: string[];
  postedAt: string;
  matchScore: number | null;
  description?: string | null;
  /** E-mail de candidatura publicado pela vaga (externas trazem na descrição da fonte). */
  applyEmail?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  authorReputation?: number | null;
  /** Marcada como falsa pela moderação — o autor perde a reputação acumulada. */
  isFake?: boolean;
  /** Estado para o usuário autenticado. */
  applied: boolean;
  saved: boolean;
  owner: boolean;
  /**
   * Estado do processo seletivo. `CLOSED` (encerrada) para de aceitar candidatura, mas preserva
   * as que ja chegaram — encerrar nao e excluir.
   */
  status: "OPEN" | "CLOSED";
  /** Quando o autor encerrou (nulo enquanto aberta). */
  closedAt?: string | null;
  /** Quantas candidaturas a vaga recebeu (exposto apenas para quem publicou). */
  applicationsCount: number;
  /** Quem publicou a vaga (nome, reputação e verificação) — mostrado no detalhe. */
  author?: JobAuthor | null;
  /** Campos personalizados do formulário de candidatura, na ordem definida pelo autor. */
  applicationFields?: JobApplicationField[];
  /** Origem: interna (nós) ou externa (ex.: JobRadar). Externas se candidatam na plataforma. */
  sourceType?: "INTERNAL" | "EXTERNAL" | null;
  /** URL original da vaga externa (para o "Visitar vaga"). */
  sourceUrl?: string | null;
  /** Nome da plataforma de origem (ex.: JobRadar). */
  sourcePlatform?: string | null;
};
