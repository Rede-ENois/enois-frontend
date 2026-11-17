/** Mensagem da mesa: IC é na voz do personagem, OOC é coordenação fora da cena. */
export type CampaignMessage = {
  id: string;
  campaignId: string;
  channel: "IC" | "OOC";
  authorId: string;
  recipientId: string | null;
  content: string;
  pinned: boolean;
  createdAt: string;
};
