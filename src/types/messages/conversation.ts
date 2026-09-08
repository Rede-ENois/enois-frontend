export type Conversation = {
  id: string;
  kind: "DIRECT" | "GROUP";
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
};
