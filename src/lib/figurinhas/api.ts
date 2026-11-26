import type { EnvioPermitido } from "@/types/application/figurinhas/envio-permitido";
import type { FigurinhaComunidadePagina } from "@/types/application/figurinhas/figurinha-comunidade-pagina";
import type { FigurinhaEnvio } from "@/types/application/figurinhas/figurinha-envio";
import type { FigurinhaImagemEnviada } from "@/types/application/figurinhas/figurinha-imagem-enviada";
import type { FigurinhaPublicada } from "@/types/application/figurinhas/figurinha-publicada";

import { api, apiUrl, buildQuery } from "@/lib/api-client";

/** Teto do arquivo, igual ao do backend (512 KB). */
export const FIGURINHA_MAX_BYTES = 512 * 1024;
/** O servidor recusa acima disto (400×400). */
export const FIGURINHA_MAX_LADO = 400;
/** Formatos que o servidor confere pelo conteúdo do arquivo, não pela extensão. */
export const FIGURINHA_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
] as const;

/** Reputação mínima para enviar figurinha (o mesmo piso do backend). */
export const FIGURINHA_REPUTACAO_MINIMA = 100;

/**
 * Figurinhas da comunidade: catálogo, envio e publicação.
 *
 * O envio tem três passos porque o backend NÃO confia no que chega: declarar o tamanho, mandar os
 * bytes (conferidos antes de qualquer gravação) e só então publicar com o código. A imagem lida
 * volta com as medidas que o servidor leu do arquivo.
 */
export const figurinhasApi = {
  pagina: (page: number, limit: number, query?: string) =>
    api.get<FigurinhaComunidadePagina>(
      `/figurinhas${buildQuery({ page, limit, q: query || undefined })}`,
    ),

  /** `codigos` sem os dois-pontos: `["nomedacomunidade"]` → `{ ":nomedacomunidade:": "https://..." }`. */
  index: (codigos: readonly string[]) => {
    const limpos = codigos.map((codigo) => codigo.replace(/^:|:$/g, "")).filter(Boolean);
    if (limpos.length === 0) return Promise.resolve({} as Record<string, string>);
    return api.get<Record<string, string>>(
      `/figurinhas/index${buildQuery({ codigos: limpos.slice(0, 100).join(",") })}`,
    );
  },

  /**
   * Se esta conta pode enviar (identidade verificada + reputação mínima), com os números: a tela
   * mostra o que falta antes de a pessoa escolher o arquivo.
   */
  envioPermitido: () => api.get<EnvioPermitido>("/figurinhas/envios/pode"),

  criarEnvio: (mimeType: string, size: number) =>
    api.post<FigurinhaEnvio>("/figurinhas/envios", { mimeType, size }),

  enviarImagem: async (envio: FigurinhaEnvio, bytes: Blob) => {
    const resposta = await fetch(apiUrl(`/figurinhas/envios/${envio.mediaId}`), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": bytes.type || "application/octet-stream" },
      body: bytes,
    });
    if (!resposta.ok) {
      throw new Error(`FIGURINHA_ENVIO_FALHOU_${resposta.status}`);
    }
    return (await resposta.json()) as FigurinhaImagemEnviada;
  },

  publicar: async (mediaId: string, codigo: string, nome: string) => {
    const publicada = await api.post<FigurinhaPublicada>("/figurinhas", {
      mediaId,
      codigo,
      nome,
    });
    return {
      ...publicada,
      figurinha: { ...publicada.figurinha, origem: "COMUNIDADE" },
    } satisfies FigurinhaPublicada;
  },

  remover: (id: string) => api.delete<void>(`/figurinhas/${id}`),
};
