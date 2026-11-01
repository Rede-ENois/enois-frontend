export type SealTier = {
  type: string;
  name: string;
  description: string;
  minCount: number;
  maxCount: number | null;
  /** Emblema fixo do nível (arquivo em `public/seals`); a API é quem o define. */
  emblem?: string;
};
