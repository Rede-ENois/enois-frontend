import type { CachedEmoteIndex } from "@/types/application/emote/cached-emote-index";

/**
 * Cópia do índice de figurinhas no `localStorage`.
 *
 * O índice já vem do NOSSO backend (não de API de terceiro) e é servido de memória, então esta
 * cópia é só o primeiro quadro: a primeira pintura de um post já desenha `KEKW` sem esperar uma
 * ida à rede. A busca em segundo plano revalida e troca a cópia.
 *
 * O conteúdo é dado que veio da rede, então é revalidado entrada por entrada antes de virar imagem
 * — e só passa caminho do proxy de figurinhas, nunca URL arbitrária.
 *
 * `v3`: a cópia antiga guardava a lista inteira das coleções globais, com URL de CDN de terceiro.
 * Trocar a chave descarta de uma vez o formato velho, em vez de deixá-lo valendo até expirar.
 */
const CHAVE = "rede:emotes:index:v3";

/** Um código de figurinha: sem espaço, sem colchete e sem crase (não quebra o markdown do texto). */
const CODIGO = /^[^\s[\]`]{1,64}$/u;
/** Caminho do proxy: `/emotes/image/{provedor}/{id}?variant=...`. */
const CAMINHO = /^\/emotes\/image\/[A-Za-z0-9]+\/[A-Za-z0-9_-]+\?[A-Za-z0-9=&_.-]*$/;

const LIMITE = 5000;

function entradasValidas(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  const entradas: Record<string, string> = {};
  let aceitas = 0;
  for (const [codigo, caminho] of Object.entries(valor as Record<string, unknown>)) {
    if (aceitas >= LIMITE) break;
    if (!CODIGO.test(codigo)) continue;
    if (typeof caminho !== "string" || !CAMINHO.test(caminho)) continue;
    entradas[codigo] = caminho;
    aceitas++;
  }
  return entradas;
}

/** A cópia salva, ou `null` quando não há (primeira visita, JSON quebrado, armazenamento bloqueado). */
export function loadCachedIndex(): CachedEmoteIndex | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<CachedEmoteIndex>;
    const entries = entradasValidas(dados.entries);
    if (Object.keys(entries).length === 0) return null;
    return { entries, savedAt: typeof dados.savedAt === "number" ? dados.savedAt : 0 };
  } catch {
    return null;
  }
}

export function saveCachedIndex(entries: Record<string, string>, savedAt = Date.now()): void {
  if (typeof window === "undefined" || Object.keys(entries).length === 0) return;
  try {
    const dados: CachedEmoteIndex = { entries, savedAt };
    window.localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Cota estourada ou modo privado: o cache é conveniência, o índice continua vindo da API.
  }
}
