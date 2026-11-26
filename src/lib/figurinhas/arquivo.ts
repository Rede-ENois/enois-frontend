import type { MimeDeFigurinha } from "@/types/application/figurinhas/mime-de-figurinha";
import type { SintomaDoArquivo } from "@/types/application/figurinhas/sintoma-do-arquivo";

import { FIGURINHA_MAX_BYTES, FIGURINHA_MAX_LADO } from "./api";

/**
 * Lê o arquivo local ANTES de enviar: tipo pelo conteúdo (os primeiros bytes), tamanho e medidas.
 *
 * Esta é só a primeira barreira — quem decide de verdade é o backend, que faz a mesma checagem
 * sobre os bytes recebidos (incluindo arquivo que finge ser PNG). Aqui ela existe para a pessoa
 * saber o que corrigir sem esperar um envio de rede.
 *
 * Quatro formatos: PNG, JPEG, GIF (animado; as medidas são do primeiro quadro) e SVG (vetor; as
 * medidas vêm do width/height ou do viewBox, e o servidor é quem sanitiza o arquivo).
 */
export async function sintomaDoArquivo(arquivo: File): Promise<SintomaDoArquivo> {
  if (arquivo.size > FIGURINHA_MAX_BYTES) return { sintoma: "FIGURINHA_ARQUIVO_GRANDE" };
  if (arquivo.size === 0) return { sintoma: "FIGURINHA_FORMATO" };
  const cabecalho = new Uint8Array(await arquivo.slice(0, 8).arrayBuffer());
  const mimeType = tipoPorBytes(cabecalho);
  if (!mimeType) return { sintoma: "FIGURINHA_FORMATO" };

  const medidas =
    mimeType === "image/svg+xml"
      ? medidasDoSvg(await arquivo.text())
      : await medidasDaImagem(arquivo);
  if (!medidas) return { sintoma: "FIGURINHA_FALHOU" };
  if (medidas.largura > FIGURINHA_MAX_LADO || medidas.altura > FIGURINHA_MAX_LADO) {
    return { sintoma: "FIGURINHA_DIMENSOES" };
  }
  return { sintoma: null, mimeType, largura: medidas.largura, altura: medidas.altura };
}

/**
 * A assinatura do arquivo, não a extensão: PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), GIF
 * (`GIF87a`/`GIF89a`, o cabeçalho inteiro) e SVG (markup que abre em `<svg`).
 */
export function tipoPorBytes(bytes: Uint8Array): MimeDeFigurinha | null {
  if (
    bytes.length >= 4 &&
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
  if (
    bytes.length >= 6 &&
    letras(bytes, 0, 4) === "GIF8" &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }
  if (bytes[0] === 0x3c) {
    return letras(bytes, 0, 4).toLowerCase() === "<svg" ? "image/svg+xml" : null;
  }
  return null;
}

function letras(bytes: Uint8Array, inicio: number, tamanho: number): string {
  return String.fromCharCode(...bytes.slice(inicio, inicio + tamanho));
}

/**
 * width/height do elemento raiz; na falta deles, o viewBox (o mesmo critério do servidor). Sem
 * nenhuma das duas medidas não há como saber o tamanho na tela: devolve `null`.
 */
export function medidasDoSvg(markup: string): { largura: number; altura: number } | null {
  const raiz = /<svg\b[^>]*>/i.exec(markup)?.[0];
  if (!raiz) return null;
  const atributo = (nome: string) =>
    new RegExp(`\\s${nome}\\s*=\\s*["']\\s*([\\d.]+)`, "i").exec(raiz)?.[1];
  const largura = atributo("width");
  const altura = atributo("height");
  if (largura && altura) {
    return { largura: Math.round(Number(largura)), altura: Math.round(Number(altura)) };
  }
  const viewBox = /\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(
    raiz,
  );
  if (viewBox) {
    return { largura: Math.round(Number(viewBox[1])), altura: Math.round(Number(viewBox[2])) };
  }
  return null;
}

/**
 * As medidas de quem desenha a imagem na tela (o mesmo leitor do navegador): vale para GIF animado,
 * em que o primeiro quadro dá o tamanho. SVG não passa por aqui — é vetor (ver `medidasDoSvg`).
 */
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
