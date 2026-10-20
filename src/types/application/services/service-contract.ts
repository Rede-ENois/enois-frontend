export type ServiceContract = {
  id: string;
  listingId?: string | null;
  requestId?: string | null;
  buyerId: string;
  sellerId: string;
  price: number;
  escrowState: "HELD" | "RELEASED" | "REFUNDED";
  deliverableNote?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
};
