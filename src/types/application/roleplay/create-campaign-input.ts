/** Corpo de criação/edição de campanha; o sistema de regras é obrigatório. */
export type CreateCampaignInput = {
  name: string;
  description?: string | null;
  setting?: string | null;
  gameSystem: string;
  systemFamily?: string;
  visibility?: string;
};
