export type MarketplacePurchase = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  state: "HELD" | "RELEASED" | "REFUNDED";
  createdAt: string;
  decidedAt?: string | null;
};
