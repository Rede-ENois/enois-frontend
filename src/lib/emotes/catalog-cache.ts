import type { CachedEmotes } from "@/types/application/emote/cached-emotes";
import type { GlobalEmote } from "@/types/application/emote/global-emote";

/**
 * O catálogo global quase não muda, mas o FrankerFaceZ responde com `cache-control: private,
 * must-revalidate` — o navegador nunca reaproveita o JSON e toda visita paga a ida à API de novo.
 * Guardar a lista no `localStorage` dá ao seletor o que mostrar no primeiro instante; a busca em
 * segundo plano revalida e troca a cópia.
 *
 * O conteúdo é dado de terceiro: o que vem do armazenamento é revalidado item por item antes de
 * virar imagem na tela.
 */
const CHAVE = "rede:emotes:global";

const PROVEDORES = new Set(["BTTV", "FFZ"]);

function isEmote(valor: unknown): valor is GlobalEmote {
  if (!valor || typeof valor !== "object") return false;
  const emote = valor as Record<string, unknown>;
  return (
    typeof emote.code === "string" &&
    emote.code !== "" &&
    typeof emote.url === "string" &&
    typeof emote.preview === "string" &&
    typeof emote.provider === "string" &&
    PROVEDORES.has(emote.provider)
  );
}

/** A cópia salva, ou `null` quando não há (primeira visita, JSON quebrado, armazenamento bloqueado). */
export function loadCachedEmotes(): CachedEmotes | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<CachedEmotes>;
    const emotes = Array.isArray(dados.emotes) ? dados.emotes.filter(isEmote) : [];
    if (emotes.length === 0) return null;
    return { emotes, savedAt: typeof dados.savedAt === "number" ? dados.savedAt : 0 };
  } catch {
    return null;
  }
}

export function saveCachedEmotes(emotes: GlobalEmote[], savedAt = Date.now()): void {
  if (typeof window === "undefined" || emotes.length === 0) return;
  try {
    const dados: CachedEmotes = { emotes, savedAt };
    window.localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Cota estourada ou modo privado: o cache é conveniência, o catálogo continua vindo da API.
  }
}
