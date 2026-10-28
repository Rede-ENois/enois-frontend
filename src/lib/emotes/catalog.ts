import type { BttvEmote } from "@/types/application/emote/bttv-emote";
import type { FfzGlobalResponse } from "@/types/application/emote/ffz-global-response";
import type { GlobalEmote } from "@/types/application/emote/global-emote";

/**
 * Figurinhas GLOBAIS do BetterTTV e do FrankerFaceZ.
 *
 * As duas APIs são públicas e liberam CORS; o catálogo é buscado pelo navegador e fica em cache
 * (react-query), sem passar pelo backend. O `code` (`KEKW`, `catJAM`) é o que a pessoa escreve no
 * texto — o mesmo contrato do Twitch — e na hora de desenhar ele vira a imagem do CDN do provedor.
 */
const BTTV_GLOBAL = "https://api.betterttv.net/3/cached/emotes/global";
const FFZ_GLOBAL = "https://api.frankerfacez.com/v1/set/global";

/** Escalas do BTTV: `1x` é 28px, `2x` 56px; a tela reduz por CSS, então `2x` fica nítido. */
const BTTV_IMAGE = (id: string) => `https://cdn.betterttv.net/emote/${id}/2x.png`;

async function fetchBttv(signal?: AbortSignal): Promise<GlobalEmote[]> {
  const response = await fetch(BTTV_GLOBAL, { signal });
  if (!response.ok) throw new Error(`BTTV respondeu ${response.status}`);
  const emotes = (await response.json()) as BttvEmote[];
  if (!Array.isArray(emotes)) return [];
  return emotes
    .filter((emote) => Boolean(emote?.id && emote?.code))
    .map((emote) => ({ code: emote.code, url: BTTV_IMAGE(emote.id), provider: "BTTV" as const }));
}

async function fetchFfz(signal?: AbortSignal): Promise<GlobalEmote[]> {
  const response = await fetch(FFZ_GLOBAL, { signal });
  if (!response.ok) throw new Error(`FFZ respondeu ${response.status}`);
  const data = (await response.json()) as FfzGlobalResponse;
  const sets = data.sets ?? {};
  const ids = data.default_sets ?? Object.keys(sets).map(Number);
  const emotes: GlobalEmote[] = [];
  for (const id of ids) {
    for (const emoticon of sets[String(id)]?.emoticons ?? []) {
      if (emoticon.hidden || !emoticon.name) continue;
      const url = emoticon.urls?.["2"] ?? emoticon.urls?.["1"] ?? emoticon.urls?.["4"];
      if (!url) continue;
      emotes.push({ code: emoticon.name, url, provider: "FFZ" as const });
    }
  }
  return emotes;
}

/**
 * As duas coleções globais, sem repetir código (o BTTV tem prioridade). Se um provedor cair, a
 * outra coleção continua valendo — figurinha de menos é melhor que seletor vazio.
 */
export async function fetchGlobalEmotes(signal?: AbortSignal): Promise<GlobalEmote[]> {
  const [bttv, ffz] = await Promise.allSettled([fetchBttv(signal), fetchFfz(signal)]);
  const byCode = new Map<string, GlobalEmote>();
  for (const result of [bttv, ffz]) {
    if (result.status !== "fulfilled") continue;
    for (const emote of result.value) {
      if (!byCode.has(emote.code)) byCode.set(emote.code, emote);
    }
  }
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/** Índice código → figurinha, para desenhar o texto sem varrer a lista a cada token. */
export function emoteIndex(emotes: GlobalEmote[]): Map<string, GlobalEmote> {
  return new Map(emotes.map((emote) => [emote.code, emote]));
}

const WHITESPACE = /(\s+)/;
/** Caracteres que podem encostar na figurinha sem fazer parte do código (`(KEKW)`). */
const TOKEN_BOUNDARY = /^([([{'"*_~]*)(.*?)([)\]}>.,;:!?'"*_~]*)$/;

function marca(emote: GlobalEmote): string {
  return `![${emote.code}](${emote.url})`;
}

function replaceToken(piece: string, index: Map<string, GlobalEmote>): string {
  const direto = index.get(piece);
  if (direto) return marca(direto);

  const partes = TOKEN_BOUNDARY.exec(piece);
  if (!partes) return piece;
  const emote = index.get(partes[2]);
  if (!emote) return piece;
  return `${partes[1]}${marca(emote)}${partes[3]}`;
}

/**
 * Troca os códigos conhecidos por imagem, preservando o resto do texto EXATAMENTE como está.
 *
 * A saída já é o markdown que o RichText do design system desenha como imagem inline: o texto
 * gravado continua sendo o código (quem edita vê `KEKW`, não um endereço de CDN). Bloco e trecho
 * de código ficam intactos — lá dentro o código é código.
 */
export function applyEmotes(content: string, index: Map<string, GlobalEmote>): string {
  if (!content || index.size === 0) return content;

  let emBloco = false;
  return content
    .split("\n")
    .map((linha) => {
      if (/^\s*```/.test(linha)) {
        emBloco = !emBloco;
        return linha;
      }
      if (emBloco || !linha) return linha;
      return linha
        .split(/(`[^`]*`)/)
        .map((pedaco, posicao) =>
          posicao % 2 === 1
            ? pedaco
            : pedaco
                .split(WHITESPACE)
                .map((token) => (WHITESPACE.test(token) ? token : replaceToken(token, index)))
                .join(""),
        )
        .join("");
    })
    .join("\n");
}
