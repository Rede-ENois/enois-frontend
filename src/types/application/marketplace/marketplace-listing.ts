export type MarketplaceListing = {
  id: string;
  sellerId: string;
  itemKind: "THEME";
  itemId: string;
  title: string;
  description?: string | null;
  price: number;
  status: "ACTIVE" | "SOLD" | "REMOVED";
  createdAt: string;
};
