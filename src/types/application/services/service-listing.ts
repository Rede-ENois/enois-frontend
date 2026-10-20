export type ServiceListing = {
  id: string;
  sellerId: string;
  category: string;
  title: string;
  description: string;
  deliverables: string;
  price: number;
  deliveryDays: number;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
};
