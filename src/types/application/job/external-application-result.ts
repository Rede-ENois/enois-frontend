/**
 * O comprovante do envio. `resumeAttached` é o que o servidor conseguiu anexar de verdade: quando
 * o download do currículo falha, o e-mail sai sem ele e este campo vem `false`.
 */
export type ExternalApplicationResult = {
  id: string;
  externalJobId: string;
  recipientEmail: string;
  subject: string;
  resumeAttached: boolean;
  resumeName: string | null;
  status: string;
  appliedAt: string;
};
