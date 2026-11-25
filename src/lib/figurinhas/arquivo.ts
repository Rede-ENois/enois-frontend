import type { SintomaDoArquivo } from "@/types/application/figurinhas/sintoma-do-arquivo";

import { FIGURINHA_MAX_BYTES, FIGURINHA_MAX_LADO } from "./api";

/**
 * Lê o arquivo local ANTES de enviar: tipo pelo conteúdo (os primeiros bytes), tamanho e medidas.
 *
 * Esta é só a primeira barreira — quem decide de verdade é o backend, que faz a mesma checagem
 * sobre os bytes recebidos (incluindo arquivo que finge ser PNG). Aqui ela existe para a pessoa
 * saber o que corrigir sem esperar um envio de rede.
 */
export async function sintomaDoArquivo(arquivo: File): Promise<SintomaDoArquivo> {
  if (arquivo.size > FIGURINHA_MAX_BYTES) return { sintoma: "FIGURINHA_ARQUIVO_GRANDE" };
  const cabecalho = new Uint8Array(await arquivo.slice(0, 8).arrayBuffer());
  const mimeType = tipoPorBytes(cabecalho);
  if (!mimeType) return { sintoma: "FIGURINHA_FORMATO" };
  if (arquivo.size === 0) return { sintoma: "FIGURINHA_FORMATO" };

  const medidas = await medidasDaImagem(arquivo);
  if (!medidas) return { sintoma: "FIGURINHA_FALHOU" };
  if (medidas.largura > FIGURINHA_MAX_LADO || medidas.altura > FIGURINHA_MAX_LADO) {
    return { sintoma: "FIGURINHA_DIMENSOES" };
  }
  return { sintoma: null, mimeType, largura: medidas.largura, altura: medidas.altura };
}

/** PNG (`89 50 4E 47`) e JPEG (`FF D8 FF`) — a assinatura, não a extensão do arquivo. */
export function tipoPorBytes(bytes: Uint8Array): "image/png" | "image/jpeg" | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

function medidasDaImagem(arquivo: Blob): Promise<{ largura: number; altura: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      resolve({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
      URL.revokeObjectURL(url);
    };
    imagem.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    imagem.src = url;
  });
}
