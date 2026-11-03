/** Os ganchos de vestir/tirar o look inteiro — ainda não estão na loja do design system. */
export type GanchosDoLook = {
  onEquipLook?: (lookId: string) => void;
  onUnequipLook?: (lookId: string) => void;
  lookPending?: string | null;
};
