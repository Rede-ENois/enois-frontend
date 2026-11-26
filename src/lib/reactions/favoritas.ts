import { PURPLE_HEART_REACTION } from "@/types/application/reaction/any-reaction-type";
import { REACTION_TYPES } from "@/types/application/reaction/reaction-type";

/** Quantas reações cabem na fileira do seletor compacto, fora o botão "+". */
export const FAVORITAS_MAX = 5;

/** O padrão de quem nunca escolheu: as duas primeiras do seletor (joinha e coração roxo). */
export const FAVORITAS_PADRAO: readonly string[] = ["LIKE", PURPLE_HEART_REACTION];

/** Toda reação oficial, com o coração roxo: o que o seletor e as pílulas podem desenhar. */
const REACOES_OFICIAIS: ReadonlySet<string> = new Set<string>([
  ...REACTION_TYPES,
  PURPLE_HEART_REACTION,
]);

/**
 * A reação de um texto solto, quando o texto é o código dela (`HEART_PURPLE`) ou o nome curto do
 * arquivo (`heart_purple`, o que as views do design system às vezes recebem no lugar da figura).
 * Serve para não desenhar o código como texto.
 */
export function reacaoDoCodigo(valor: string | null | undefined): string | null {
  const codigo = (valor ?? "").trim();
  if (!codigo) return null;
  const maiusculo = codigo.toUpperCase();
  if (REACOES_OFICIAIS.has(maiusculo)) return maiusculo;
  // Algumas views recebem o ARQUIVO da figurinha no lugar do emoji: o nome dele é o mesmo código
  // em minúsculas (`/emojis/enois/heart_purple.svg`).
  const arquivo = /^\/emojis\/enois\/([a-z0-9_]+)\.[a-z]+$/.exec(codigo);
  const pelaFigura = arquivo?.[1]?.toUpperCase();
  return pelaFigura && REACOES_OFICIAIS.has(pelaFigura) ? pelaFigura : null;
}

/** Um código de reação: o `ReactionType` ou `HEART_PURPLE`. Nada além disso entra na fileira. */
export function ehTipoDeReacao(valor: unknown): valor is string {
  return typeof valor === "string" && /^[A-Z][A-Z0-9_]{0,39}$/.test(valor);
}

/** Tira a reação da fileira; devolve a lista como estava se ela não estava lá. */
export function semFavorita(favoritas: readonly string[], tipo: string): string[] {
  return favoritas.filter((item) => item !== tipo);
}

/** Põe a reação no fim da fileira (se ela já estava, mantém a posição). */
export function comFavorita(favoritas: readonly string[], tipo: string): string[] {
  return favoritas.includes(tipo) ? [...favoritas] : [...favoritas, tipo].slice(0, FAVORITAS_MAX);
}

/** Move a reação uma casa para o lado (`-1` para a esquerda, `1` para a direita). */
export function moverFavorita(
  favoritas: readonly string[],
  tipo: string,
  direcao: -1 | 1,
): string[] {
  const i = favoritas.indexOf(tipo);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= favoritas.length) return [...favoritas];
  const proxima = [...favoritas];
  [proxima[i], proxima[j]] = [proxima[j], proxima[i]];
  return proxima;
}

/**
 * A fileira que a tela mostra: a escolha da pessoa mais as reações elegíveis que ainda não estão
 * nela, até `FAVORITAS_MAX`. Reação desconhecida guardada de uma versão antiga é ignorada.
 */
export function fileiraDeFavoritas(
  favoritas: readonly string[],
  elegiveis: readonly string[],
): string[] {
  const existe = (tipo: string) => elegiveis.includes(tipo);
  const vistas = new Set<string>();
  const resultado: string[] = [];
  for (const tipo of favoritas) {
    if (existe(tipo) && !vistas.has(tipo) && resultado.length < FAVORITAS_MAX) {
      vistas.add(tipo);
      resultado.push(tipo);
    }
  }
  for (const tipo of elegiveis) {
    if (resultado.length >= FAVORITAS_MAX) break;
    if (!vistas.has(tipo)) {
      vistas.add(tipo);
      resultado.push(tipo);
    }
  }
  return resultado;
}

/**
 * A fileira de quem escolheu: só a escolha, na ordem dela, sem reação que o seletor não tem mais e
 * no máximo `FAVORITAS_MAX`. Diferente de `fileiraDeFavoritas`, não completa com outras reações — é
 * a fileira da própria escolha, a que a barra do modal mostra.
 */
export function fileiraDaEscolha(
  favoritas: readonly string[],
  elegiveis: readonly string[],
): string[] {
  const fileira: string[] = [];
  for (const tipo of favoritas) {
    if (elegiveis.includes(tipo) && !fileira.includes(tipo) && fileira.length < FAVORITAS_MAX) {
      fileira.push(tipo);
    }
  }
  return fileira;
}
