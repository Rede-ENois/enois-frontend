import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import type { PublicacaoFigurinha } from "@/types/application/figurinhas/publicacao-figurinha";

import { figurinhasApi } from "./api";
import { sintomaDoArquivo } from "./arquivo";

/** Mesmo formato das figurinhas oficiais: sem espaço, colchete ou crase (não quebra o markdown). */
const CODIGO = /^[^\s:[\]`]{1,64}$/u;

/**
 * Só código da comunidade: letras minúsculas/números/`_`/`-`, começando por letra. O backend é
 * quem recusa os prefixos reservados (`enois_`, `bttv_`, `ffz_`) — aqui a regra é a mesma que a
 * tela mostra antes de enviar.
 */
export const CODIGO_COMUNIDADE = /^[a-z][a-z0-9_-]{1,31}$/;

/** O código como ele entra no texto: `:codigo:`, sem duplicar os dois-pontos que a pessoa digitou. */
export function normalizarCodigo(digitado: string): string {
  return `:${digitado
    .trim()
    .replace(/^:+|:+$/g, "")
    .toLowerCase()}:`;
}

function mensagemDeErro(falha: unknown): string {
  const texto = falha instanceof Error ? falha.message : String(falha);
  // O backend devolve o código no corpo; o cliente da API o inclui na mensagem. A recusa pelo
  // portão de envio tem código fora do prefixo (REPUTACAO_INDISPONIVEL) e entra na lista.
  const codigo = /FIGURINHA_[A-Z_]+|REPUTACAO_INDISPONIVEL|LOW_REPUTATION/.exec(texto)?.[0];
  // O envio dos bytes não passa pelo cliente `api`, então o erro dele não carrega o código do corpo.
  const status = /FIGURINHA_ENVIO_FALHOU_(\d{3})/.exec(texto)?.[1];
  if (status === "403") return "REPUTACAO_INDISPONIVEL";
  if (status === "429") return "RATE_LIMIT_EXCEEDED";
  return codigo ?? "FIGURINHA_FALHOU";
}

/**
 * Envia e publica uma figurinha da comunidade.
 *
 * A conferência local da imagem é só cortesia (o servidor confere tudo de novo):
 * 1. o arquivo precisa ser PNG/JPG/GIF/SVG de verdade, até 400×400 e 512 KB (`arquivo.ts`);
 * 2. o servidor decide onde guardar (`/figurinhas/envios`) e confere os bytes antes de gravar;
 * 3. só depois o código e o nome são publicados.
 */
export async function publicarFigurinha(
  arquivo: File,
  codigoDigitado: string,
  nome: string,
): Promise<PublicacaoFigurinha> {
  const codigo = normalizarCodigo(codigoDigitado);
  if (!CODIGO.test(codigo.slice(1, -1)) || !CODIGO_COMUNIDADE.test(codigo.slice(1, -1))) {
    return { ok: false, erro: "FIGURINHA_CODIGO_INVALIDO" };
  }
  try {
    const info = await sintomaDoArquivo(arquivo);
    if (info.sintoma) return { ok: false, erro: info.sintoma };
    const envio = await figurinhasApi.criarEnvio(info.mimeType, arquivo.size);
    const imagem = await figurinhasApi.enviarImagem(envio, arquivo);
    const publicada = await figurinhasApi.publicar(imagem.mediaId, codigo, nome.trim());
    return { ok: true, figurinha: publicada.figurinha };
  } catch (falha) {
    return { ok: false, erro: mensagemDeErro(falha) };
  }
}
