export type MessageReply = {
  id: string;
  from: string;
  text: string;
  e2e: boolean;
  /** Metadados da mensagem original, necessários para decifrar a citação no cliente. */
  iv?: string | null;
  encryptedKeys?: Record<string, string> | string | null;
};
