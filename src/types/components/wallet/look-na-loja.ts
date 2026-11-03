import type { CosmeticShopLook } from "@rede-enois/design-system/domain";

/**
 * O look como a loja precisa dele: o design system ainda não traz os dois campos que dizem se o
 * look já é da pessoa e se está vestido, e é por eles que o clique veste em vez de provar.
 */
export type LookNaLoja = CosmeticShopLook & { owned?: boolean; equipped?: boolean };
