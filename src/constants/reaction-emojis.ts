import { PURPLE_HEART_REACTION } from "@/types/application/reaction/any-reaction-type";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { ENOIS_CUSTOM_EMOJIS, getEnoisEmojiByCode } from "@/lib/emotes/enois-pack";

/**
 * Emoji de apoio de cada reação oficial: o símbolo que textos e leitores de tela usam quando não
 * há imagem (a API guarda o tipo, nunca o emoji).
 *
 * As 26 primeiras ficam como estavam: são o rosto que quem já reagiu reconhece no texto.
 *
 * Este mapa NÃO é o conteúdo das views do design system — lá vai `REACTION_FIGURE_EMOJIS`, o emoji
 * da própria figura. Usar o de apoio ali faria a pílula de um tipo mostrar o rosto de outro (vários
 * tipos dividem o mesmo emoji de apoio), e clicar nela gravaria um tipo diferente do que se vê.
 *
 * O leitor de glifo (`useEnoisReactionGlyphs`, que pinta o ícone no texto) casa o emoji de apoio
 * primeiro: é ele que está no texto de quem reagiu. Por isso as 26 originais não têm emoji de apoio
 * repetido; nas novas, quando o de apoio repete, o texto mostra o ícone do tipo que aparece antes —
 * o que aparece na tela é o mesmo da figura, mas o tipo de lá pode não ser o da figura.
 */
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  ROFL: "🤣",
  SKULL: "💀",
  WOW: "😮",
  SAD: "😢",
  SOB: "😭",
  CELEBRATE: "🎉",
  SUPPORT: "💪",
  INSIGHTFUL: "💡",
  ANGRY: "😡",
  DISGUST: "🤢",
  SKEPTICAL: "🧐",
  EYES: "👀",
  NOTE: "📝",
  FIRE: "🔥",
  CLAP: "👏",
  CLOWN: "🤡",
  NAILS: "💅",
  // Contextuais: cada um tem situação clara de uso (ver ReactionType no backend).
  USEFUL: "🧰",
  RELATABLE: "🫂",
  HYPE: "🚀",
  THANKS: "🙏",
  VIBE: "✨",
  SALUTE: "🫡",
  // As novas: o mesmo Unicode do ícone do pacote, para a reação aparecer mesmo sem a imagem.
  COOL: "🤮",
  SLEEP: "🤢",
  THINK: "💀",
  NERD: "🙄",
  PARTY: "🚀",
  COFFEE: "🧙",
  SELFIE: "👨‍🍳",
  THERMOMETER: "🏄",
  PIRATE: "🎩",
  HERO: "🖕",
  ZANY: "😉",
  SCREAM: "😁",
  GRIMACE: "🤬",
  MELTING: "😡",
  CRYING: "🤑",
  MINDBLOWN: "😨",
  VOMIT: "👋",
  FUMING: "✌️",
  EYEROLL: "👌",
  ROBOT: "🤘",
  WIZARD: "👎",
  CHEF: "👏",
  SURF: "🙌",
  MAGIC: "🙏",
  REBEL: "🤭",
  WINK: "🤗",
  ALIEN: "😷",
  RAGE: "🤠",
  MONEY: "😏",
  FEAR: "👻",
  WAVE: "💩",
  PEACE: "🤖",
  OK: "👽",
  ROCK: "🧐",
  DISLIKE: "🖖",
  RAISED: "🤞",
  GASP: "👉",
  POOP: "🤜",
  TONGUE: "💪",
  KISS: "🤩",
  DROOL: "😜",
  STARSTRUCK: "😘",
  VULCAN: "🤤",
  CROSSED: "💡",
  POINT_RIGHT: "📝",
  FISTBUMP: "🔥",
  MASK: "🤡",
  COWBOY: "💅",
  SMIRK: "🧰",
  GHOST: "🫡",
};

/** Thumbnail oficial de uma reação: o próprio ícone do pacote É Nóis (o mesmo que o texto mostra). */
function officialAsset(slug: string): string {
  const src = getEnoisEmojiByCode(`enois_${slug}`)?.src;
  if (!src) throw new Error(`Reação oficial sem ícone no pacote É Nóis: enois_${slug}`);
  return src;
}

/**
 * Ícones oficiais da Rede É Nóis para cada `ReactionType`, na ordem do seletor: a reação i é o
 * ícone i do pacote `ENOIS_CUSTOM_EMOJIS`. Só o pacote É Nóis entra aqui — a lista de reações é a
 * das oficiais, sem figuras de BTTV/FrankerFaceZ, que são do texto, não da reação.
 */
export const REACTION_EMOJI_ASSETS: Record<ReactionType, string> = {
  LIKE: officialAsset("like"),
  LOVE: officialAsset("love"),
  LAUGH: officialAsset("joy"),
  ROFL: officialAsset("sparkle"),
  SKULL: officialAsset("wow"),
  WOW: officialAsset("angry"),
  SAD: officialAsset("cool"),
  SOB: officialAsset("cry"),
  CELEBRATE: officialAsset("sob"),
  SUPPORT: officialAsset("sleep"),
  INSIGHTFUL: officialAsset("think"),
  ANGRY: officialAsset("nerd"),
  DISGUST: officialAsset("party"),
  SKEPTICAL: officialAsset("confetti"),
  EYES: officialAsset("coffee"),
  NOTE: officialAsset("selfie"),
  FIRE: officialAsset("thermometer"),
  CLAP: officialAsset("pirate"),
  CLOWN: officialAsset("hero"),
  NAILS: officialAsset("zany"),
  USEFUL: officialAsset("scream"),
  RELATABLE: officialAsset("grimace"),
  HYPE: officialAsset("melting"),
  THANKS: officialAsset("pleading"),
  VIBE: officialAsset("eyes"),
  SALUTE: officialAsset("mindblown"),
  COOL: officialAsset("vomit"),
  SLEEP: officialAsset("nauseated"),
  THINK: officialAsset("skull"),
  NERD: officialAsset("eyeroll"),
  PARTY: officialAsset("rocket"),
  COFFEE: officialAsset("wizard"),
  SELFIE: officialAsset("chef"),
  THERMOMETER: officialAsset("surf"),
  PIRATE: officialAsset("magic"),
  HERO: officialAsset("rebel"),
  ZANY: officialAsset("wink"),
  SCREAM: officialAsset("grin"),
  GRIMACE: officialAsset("rage"),
  MELTING: officialAsset("mad"),
  CRYING: officialAsset("money"),
  MINDBLOWN: officialAsset("fear"),
  VOMIT: officialAsset("wave"),
  FUMING: officialAsset("peace"),
  EYEROLL: officialAsset("ok"),
  ROBOT: officialAsset("rock"),
  WIZARD: officialAsset("dislike"),
  CHEF: officialAsset("clap"),
  SURF: officialAsset("raised"),
  MAGIC: officialAsset("pray"),
  REBEL: officialAsset("gasp"),
  WINK: officialAsset("hug"),
  ALIEN: officialAsset("mask"),
  RAGE: officialAsset("cowboy"),
  MONEY: officialAsset("smirk"),
  FEAR: officialAsset("ghost"),
  WAVE: officialAsset("poop"),
  PEACE: officialAsset("robot"),
  OK: officialAsset("alien"),
  ROCK: officialAsset("monocle"),
  DISLIKE: officialAsset("vulcan"),
  RAISED: officialAsset("crossed"),
  GASP: officialAsset("point_right"),
  POOP: officialAsset("fistbump"),
  TONGUE: officialAsset("muscle"),
  KISS: officialAsset("starstruck"),
  DROOL: officialAsset("tongue"),
  STARSTRUCK: officialAsset("kiss"),
  VULCAN: officialAsset("drool"),
  CROSSED: officialAsset("insightful"),
  POINT_RIGHT: officialAsset("note"),
  FISTBUMP: officialAsset("fire"),
  MASK: officialAsset("clown"),
  COWBOY: officialAsset("nails"),
  SMIRK: officialAsset("useful"),
  GHOST: officialAsset("salute"),
};

const EMOJI_BY_SRC = new Map(ENOIS_CUSTOM_EMOJIS.map((item) => [item.src, item.unicode]));
const LABEL_BY_SRC = new Map(ENOIS_CUSTOM_EMOJIS.map((item) => [item.src, item.label]));

/** Emoji da figura apontada por `REACTION_EMOJI_ASSETS`, ou erro se o pacote não tiver um. */
function figureEmoji(type: ReactionType): string {
  const glyph = EMOJI_BY_SRC.get(REACTION_EMOJI_ASSETS[type]);
  if (!glyph) throw new Error(`Figura da reação ${type} sem emoji no pacote É Nóis`);
  return glyph;
}

/**
 * A fileira do seletor de reações, na ordem em que a view a recebe: o joinha (o gatilho), o coração
 * roxo e então as reações oficiais na ordem delas. O coração roxo é a figura nova que só existe no
 * pacote; as demais chaves são `ReactionType` — o tipo que o clique grava.
 */
export const REACTION_PICKER_ORDER: readonly string[] = [
  "LIKE",
  PURPLE_HEART_REACTION,
  ...(Object.keys(REACTION_EMOJI_ASSETS) as ReactionType[]).filter((type) => type !== "LIKE"),
];

/**
 * Emoji de cada figura — o valor que as views do design system recebem em `emojis[type]`.
 *
 * A view escolhe a reação pelo mapa (`emojis[type]` é a chave, e o clique devolve a chave) e desenha
 * o valor. Para o desenho e o tipo salvo serem o mesmo, o valor do tipo X é a figura de X: o leitor
 * de glifo (`useEnoisReactionGlyphs`) reconhece o emoji de volta como X e o CSS pinta o ícone de X.
 * O emoji de apoio (`REACTION_EMOJIS`) não serve aqui: dois tipos podem dividi-lo, e a pílula de um
 * apareceria com o rosto do outro — clicando nela, a pessoa gravaria o tipo errado.
 */
export const REACTION_FIGURE_EMOJIS: Record<ReactionType, string> = Object.fromEntries(
  (Object.keys(REACTION_EMOJI_ASSETS) as ReactionType[]).map((type) => [type, figureEmoji(type)]),
) as Record<ReactionType, string>;

/** A figura que o coração roxo desenha no seletor — vem do pacote, não é um `ReactionType`. */
function heartPurpleSource(): string {
  const src = getEnoisEmojiByCode("enois_heart_purple")?.src;
  if (!src) throw new Error("Coração roxo sem figura no pacote É Nóis");
  return src;
}

/**
 * O que o seletor de reações recebe (`ReactionPicker`/`ReactionsSummary`) como `emojis`: a ordem de
 * `REACTION_PICKER_ORDER` num mapa chave → figura, porque o seletor desenha as chaves na ordem do
 * mapa. A chave é o que o clique grava — o coração roxo grava `HEART_PURPLE`, que a API aceita como
 * qualquer outro tipo. Uma pílula desenha a figura do tipo dela, e é esta a fonte (não um mapa só
 * de `ReactionType`): com a fileira mudando de ordem, a pílula não pode depender dela.
 */
export const REACTION_PICKER_EMOJIS: Record<string, string> = Object.fromEntries(
  REACTION_PICKER_ORDER.map((chave) => [
    chave,
    chave === PURPLE_HEART_REACTION
      ? heartPurpleSource()
      : REACTION_FIGURE_EMOJIS[chave as ReactionType],
  ]),
);

/**
 * O emoji do coração roxo (💜) e o nome dele — o mesmo raciocínio do `REACTION_FIGURE_EMOJIS` para
 * as expressões: o leitor de glifo casa o desenho e o CSS pinta o arquivo do pacote.
 */
export const PURPLE_HEART_EMOJI: string =
  ENOIS_CUSTOM_EMOJIS.find((item) => item.code === "enois_heart_purple")?.unicode ?? "💜";
export const PURPLE_HEART_LABEL: string =
  ENOIS_CUSTOM_EMOJIS.find((item) => item.code === "enois_heart_purple")?.label ?? "Coração roxo";

/** Rótulo legível (em português) de cada reação oficial para tooltips de hover. */
export const REACTION_EMOJI_LABELS: Record<ReactionType, string> = Object.fromEntries(
  (Object.keys(REACTION_EMOJI_ASSETS) as ReactionType[]).map((type) => [
    type,
    LABEL_BY_SRC.get(REACTION_EMOJI_ASSETS[type]) ?? type.toLowerCase(),
  ]),
) as Record<ReactionType, string>;
