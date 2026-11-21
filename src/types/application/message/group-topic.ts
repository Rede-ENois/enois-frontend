/** Um tópico de dentro do grupo de conversa. */
export type GroupTopic = {
  id: string;
  conversationId: string;
  name: string;
  position: number;
  status: "OPEN" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};
