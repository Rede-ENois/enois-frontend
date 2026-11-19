import type { CosmeticShopProps } from "@rede-enois/design-system/domain";

import type { CapaEmHtml } from "./capa-em-html";
import type { GanchosDoLook } from "./ganchos-do-look";

export type CosmeticCatalogProps = CosmeticShopProps &
  GanchosDoLook & {
    /**
     * A capa em HTML de quem está comprando. O cartão de prévia mostra a faixa real do perfil,
     * como a rota do perfil; sem ela o cartão cai na capa imagem/gradiente.
     */
    bannerHtml?: CapaEmHtml;
  };
