export type Conversation = {
  id: string;
  kind: "DIRECT" | "GROUP" | "JOB" | "SERVICE";
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
  /** Quando o outro participante abriu a conversa pela última vez (recibo de leitura). */
  otherLastReadAt?: string | null;
};
