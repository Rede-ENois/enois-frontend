/**
 * Parâmetros da compressão de imagem no cliente, antes do upload.
 *
 * A compressão acontece aqui porque o arquivo que o celular tira (12 MP, 8–12 MB) é muito
 * maior do que qualquer lugar do app mostra: os limites do servidor (#546) não reduzem nada.
 * Ajusta apenas imagens de câmera/álbum comuns; GIF animado e formatos que o canvas do
 * navegador não reencoda passam como vieram.
 */
export type CompressOptions = {
  /** Lado maior máximo da imagem comprimida, em pixels. */
  maxSide: number;
  /** Qualidade do reencode (0–1), quando o formato suporta. */
  quality: number;
  /** MIME de saída; o navegador decide o reencode real. */
  outputType: string;
  /** Arquivos menores que isso (em bytes) não pagam o custo do canvas. */
  minBytes: number;
};
