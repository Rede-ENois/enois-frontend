import type { ConversationIdentity } from "./conversation-identity";

export type Conversation = {
  id: string;
  kind: "DIRECT" | "GROUP" | "JOB" | "FREELANCE" | "SERVICE" | "BUSINESS_DIRECT";
  /** Inbox the conversation lives in: JOB, FREELANCE and SERVICE are professional. */
  context?: "SOCIAL" | "PROFESSIONAL";
  /**
   * Professional threads: the active professional identity of each participant, by account id.
   * Whoever is here must be shown with it (professional @), never with the social profile.
   */
  identities?: Record<string, ConversationIdentity>;
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
  /** Quando o outro participante abriu a conversa pela última vez (recibo de leitura). */
  otherLastReadAt?: string | null;
  /** A última mensagem é E2E (ciphertext em lastMessage). */
  lastMessageE2e?: boolean;
  /** IV da última mensagem E2E (necessário pra decifrar). */
  lastMessageIv?: string | null;
};
