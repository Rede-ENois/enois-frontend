import type { FigurinhaOrigem } from "@/types/application/figurinhas/figurinha-origem";

/** O catálogo do próprio site: `:enois_like:`, `:bttv_x:` e `:ffz_x:` (o backend reserva os nomes). */
export const ORIGENS_RESERVADAS = ["enois_", "bttv_", "ffz_"] as const;

export function origemReservada(codigo: string): (typeof ORIGENS_RESERVADAS)[number] | null {
  for (const prefixo of ORIGENS_RESERVADAS) {
    if (codigo.startsWith(prefixo)) return prefixo;
  }
  return null;
}

function origemDoPrefixo(prefixo: string | undefined): FigurinhaOrigem {
  switch (prefixo) {
    case "enois_":
      return "ENOIS";
    case "bttv_":
      return "BTTV";
    case "ffz_":
      return "FFZ";
    default:
      return "COMUNIDADE";
  }
}

/**
 * De onde vem um código do texto. O catálogo oficial usa a reserva de prefixo; o da comunidade é
 * qualquer outro código (`:nomedacomunidade:`) — as duas origens nunca se cruzam.
 */
export function origemDoCodigo(codigo: string): FigurinhaOrigem {
  return origemDoPrefixo(origemReservada(codigo) ?? undefined);
}

/**
 * O caminho que veio no índice já é um endereço PÚBLICO completo (CDN/S3) ou do pacote do app
 * (`/emojis/...`). Fazer o caminho passar pelo CDN de mídia (ImageKit) mandava um endereço de S3
 * para lá e a figurinha sumia da tela.
 */
export function imagemDoIndice(caminho: string): string {
  return caminho;
}
