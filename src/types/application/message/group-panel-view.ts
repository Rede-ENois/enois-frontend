import type { GroupParticipantView } from "./group-panel";

/** O painel do grupo (`GET /conversations/{id}/group/participants`). */
export type GroupPanelView = {
  conversationId: string;
  myRole: "OWNER" | "ADMIN" | "MEMBER";
  participants: GroupParticipantView[];
};
