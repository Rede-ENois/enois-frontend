/**
 * O e-mail de candidatura que o Énóis vai enviar, montado pelo servidor. Nada foi enviado ainda.
 */
export type ExternalApplicationDraft = {
  recipientEmail: string;
  subject: string;
  body: string;
  /** Há currículo no perfil para anexar. */
  resumeAvailable: boolean;
  resumeName: string | null;
  jobTitle: string;
  company: string | null;
  jobUrl: string | null;
};
