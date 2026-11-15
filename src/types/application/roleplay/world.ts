/** Entrada do atlas do mundo da campanha. O id da ficha vinculada nunca sai da API. */
export type WorldEntry = {
  id: string;
  campaignId: string;
  kind: "LOCALE" | "CHARACTER" | "ITEM" | "PLOT" | "LORE";
  title: string;
  body: string | null;
  tags: string[];
  linkedToSheet: boolean;
  linkedSheetName: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
