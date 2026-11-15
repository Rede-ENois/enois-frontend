export type SheetTemplate = {
  id: string;
  campaignId: string;
  gameSystem: string;
  fields: {
    key: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
    maxVisibility: "PRIVATE" | "GAME_MASTER" | "CAMPAIGN";
  }[];
  updatedAt: string;
};
