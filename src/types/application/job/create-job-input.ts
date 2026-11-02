import type { JobApplicationFieldInput } from "./job-application-field-input";

export type CreateJobInput = {
  title: string;
  company: string;
  /** Company page the job is published by; the poster must be on its team (recruiter and up). */
  companyId?: string;
  location: string;
  type: string;
  level: string;
  /** A vaga nova exige valor: o backend recusa sem `salaryMin` maior que zero. */
  salaryMin: string;
  /** Teto opcional da faixa; se vier, tem que ser maior ou igual ao mínimo. */
  salaryMax?: string;
  /** Período do valor: HOUR, DAY, MONTH (padrão) ou YEAR. */
  salaryPeriod?: string;
  /** O que a pessoa vai fazer; o backend recusa vaga sem descrição. */
  description: string;
  salary?: string;
  /** Moeda vigente da vaga (BRL por padrão). */
  currency?: string;
  skills: string[];
  /** Declaração de que a vaga é real e respeita as regras da comunidade. */
  communityAgreement?: boolean;
  /** Formulário de candidatura definido por quem publica (campos obrigatórios ou opcionais). */
  applicationFields?: JobApplicationFieldInput[];
};
