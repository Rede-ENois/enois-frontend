export type LojaItem = {
  id: string;
  name: string;
  description: string;
  priceMf: number;
  cssRing: string;
  owned?: boolean;
  equipped?: boolean;
};
