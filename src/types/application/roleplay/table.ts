/** Mesa da campanha: voz do Épapo opcional, ordem de turno e cena vivas no servidor. */
export type GameTable = {
  id: string;
  campaignId: string;
  name: string;
  ownerId: string;
  hasVoice: boolean;
  open: boolean;
  createdAt: string;
  updatedAt: string;
};
