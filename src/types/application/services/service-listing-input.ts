/** O que o prestador envia ao publicar ou editar uma oferta (o mesmo corpo nos dois casos). */
export type ServiceListingInput = {
  category: string;
  title: string;
  description: string;
  deliverables: string;
  price: number;
  currency?: "FAISCA" | "BRL";
  deliveryDays: number;
};
