import type { CustomEmojiEntry } from "@/types/application/emote/custom-emoji";

const entry = (
  slug: string,
  label: string,
  unicode: string | null,
  keywords: readonly string[],
  unicodeAliases?: readonly string[],
  ext: "webp" | "svg" = "webp",
): CustomEmojiEntry => ({
  code: `enois_${slug}`,
  label,
  src: `/emojis/enois/${slug}.${ext}`,
  unicode,
  unicodeAliases,
  keywords,
});

/**
 * Pacote oficial de emojis personalizados da Rede É Nóis.
 *
 * Mantém retrocompatibilidade total: cada expressão mapeia para o código Unicode real equivalente
 * (quando existe), permitindo que textos antigos e novos salvem Unicode padrão e exibam o mascote
 * e os ícones customizados da plataforma.
 */
export const ENOIS_CUSTOM_EMOJIS: readonly CustomEmojiEntry[] = [
  // Mascote Joinha É Nóis (núcleo de reações e expressões)
  entry("like", "Joinha É Nóis", "👍", ["joinha", "like", "curtir", "enois", "top"]),
  entry(
    "love",
    "Apaixonado",
    "😍",
    ["amor", "coracao", "apaixonado", "love"],
    ["❤️", "❤", "💜", "🥰"],
  ),
  entry("joy", "Chorando de rir", "😂", ["rir", "risos", "lol", "kekw", "rs"], ["🤣"]),
  entry("sparkle", "Piscada brilhante", "✨", ["brilho", "vibe", "piscada", "top"]),
  entry("wow", "Chocado", "😮", ["uau", "wow", "chocado", "surpreso"], ["😯", "😲"]),
  entry("angry", "Fumegando", "😤", ["bravo", "raiva", "fumegando"]),
  entry("cool", "Estiloso", "😎", ["oculos", "cool", "estilo", "mitou"]),
  entry("cry", "Triste", "😢", ["triste", "chorando", "lagrima"]),
  entry("sob", "Chorando muito", "😭", ["choro", "bua", "tristeza"]),
  entry("sleep", "Dormindo", "😴", ["sono", "dormir", "zzz", "cansado"]),
  entry("think", "Pensando", "🤔", ["pensar", "duvida", "hm", "sera"]),
  entry("nerd", "Nerd", "🤓", ["nerd", "geek", "dev", "oculos", "estudo"]),
  entry("party", "Festa", "🥳", ["festa", "parabens", "aniversario"]),
  entry("confetti", "Comemorando", "🎉", ["comemorar", "confete", "celebrar"]),
  entry("coffee", "Café", "☕", ["cafe", "manha", "energia", "dev"]),
  entry("selfie", "Selfie", "🤳", ["selfie", "foto", "celular"]),
  entry("thermometer", "Doente", "🤒", ["doente", "febre", "termometro"]),
  entry("pirate", "Pirata", "🏴‍☠️", ["pirata", "enois", "navio"]),
  entry("hero", "Super-herói", "🦸", ["heroi", "super", "capa"]),
  entry("zany", "Doidinho", "🤪", ["doido", "careta", "zoeira"]),
  entry("scream", "Gritando de medo", "😱", ["medo", "grito", "susto", "socorro"]),
  entry("grimace", "Constrangido", "😬", ["eita", "tenso", "vergonha", "dentes"]),
  entry("melting", "Derretendo", "🫠", ["derretendo", "calor", "tenso", "socorro"]),
  entry("pleading", "Pidão", "🥹", ["pidao", "fofo", "por favor", "emocionado"], ["🥺"]),
  entry("eyes", "De olho", "👀", ["olho", "olhando", "curioso", "fofoca"]),
  entry("mindblown", "Mente explodindo", "🤯", ["explodiu", "mente", "genial", "chocante"]),
  entry("vomit", "Vomitando", "🤮", ["nojo", "vomito", "eca"]),
  entry("nauseated", "Enjoado", "🤢", ["enjoado", "nojo", "verde"]),
  entry("skull", "Caveira", "💀", ["caveira", "morri", "rip"], ["☠️", "☠"]),
  entry("eyeroll", "Revirando os olhos", "🙄", ["tedio", "paciencia", "aff"]),

  // Variações temáticas divertidas
  entry("rocket", "Foguete", "🚀", ["foguete", "hype", "voando", "deploy"]),
  entry("wizard", "Mago", "🧙", ["mago", "bruxo", "magia", "codigo"]),
  entry("chef", "Chef", "👨‍🍳", ["chef", "cozinheiro", "cozinhar"]),
  entry("surf", "Surfista", "🏄", ["surf", "onda", "praia"]),
  entry("magic", "Cartola mágica", "🎩", ["magica", "cartola", "truque"]),
  entry("rebel", "Rebelde", "🖕", ["rebelde", "dedo", "maroto", "enois"]),

  // Emojis e mãos redondas no estilo É Nóis
  entry("wink", "Piscando", "😉", ["piscar", "piscadinha"]),
  entry("grin", "Sorrindo", "😁", ["sorriso", "feliz", "alegre"]),
  entry("rage", "Furioso", "🤬", ["furioso", "raiva", "puto"]),
  entry("mad", "Bravo", "😡", ["bravo", "zangado", "irritado"], ["😠"]),
  entry("money", "Dinheiro", "🤑", ["dinheiro", "rico", "grana", "cifrao"]),
  entry("fear", "Assustado", "😨", ["assustado", "medo", "panico"], ["😰"]),
  entry("wave", "Tchau", "👋", ["oi", "ola", "tchau", "aceno"]),
  entry("peace", "Paz e amor", "✌️", ["paz", "vitoria", "dois"]),
  entry("ok", "OK", "👌", ["ok", "perfeito", "beleza"]),
  entry("rock", "Rock", "🤘", ["rock", "metal", "show"]),
  entry("dislike", "Não curti", "👎", ["deslike", "nao", "ruim"]),
  entry("clap", "Palmas", "👏", ["palmas", "parabens", "aplauso"]),
  entry("raised", "Mãos pra cima", "🙌", ["oba", "aleluia", "vitoria"]),
  entry("pray", "Por favor / Obrigado", "🙏", ["obrigado", "rezar", "amem", "por favor"]),
  entry("gasp", "Ops", "🤭", ["ops", "segredo", "risadinha"]),
  entry("hug", "Abraço", "🤗", ["abraco", "carinho", "tamo junto"], ["🫂"]),
  entry("mask", "Máscara", "😷", ["mascara", "saude", "doente"]),
  entry("cowboy", "Cowboy", "🤠", ["cowboy", "chapeu", "yeehaw"]),
  entry("smirk", "Sorriso maroto", "😏", ["maroto", "malandro", "sei"]),
  entry("ghost", "Fantasma", "👻", ["fantasma", "bu", "halloween"]),
  entry("poop", "Cocô roxo", "💩", ["coco", "merda", "zoeira"]),
  entry("robot", "Robô", "🤖", ["robo", "ia", "bot", "tech"]),
  entry("alien", "Alien", "👽", ["alien", "et", "espaco"]),
  entry("monocle", "Monóculo", "🧐", ["analise", "monoculo", "suspeito", "cetico"], ["🤨"]),
  entry("vulcan", "Saudação vulcana", "🖖", ["spock", "vulcano", "vida longa"]),
  entry("crossed", "Dedos cruzados", "🤞", ["sorte", "tomara", "dedos cruzados"]),
  entry("point_right", "Apontando", "👉", ["apontar", "olha", "aqui"]),
  entry("fistbump", "Toca aqui", "🤜", ["soco", "toca aqui", "parceria"], ["🤛", "👊"]),
  entry("muscle", "Força", "💪", ["forca", "forte", "treino", "apoio"]),
  entry("starstruck", "Olhos de estrela", "🤩", ["estrela", "incrivel", "famoso"]),
  entry("tongue", "Língua de fora", "😜", ["lingua", "brincadeira", "zoeira"], ["😛"]),
  entry("kiss", "Beijinho", "😘", ["beijo", "carinho", "coracao"]),
  entry("drool", "Babando", "🤤", ["babando", "delicia", "vontade"]),
  entry("insightful", "Genial", "💡", ["ideia", "lampada", "genial", "insight"], undefined, "svg"),
  entry("note", "Anotado", "📝", ["nota", "anotar", "resumo"], undefined, "svg"),
  entry("fire", "Pegando fogo", "🔥", ["fogo", "fire", "top", "quente"], undefined, "svg"),
  entry("clown", "Palhaço", "🤡", ["palhaco", "clown", "zoeira"], undefined, "svg"),
  entry("nails", "Arrasou", "💅", ["unha", "arrasou", "deboche"], undefined, "svg"),
  entry("useful", "Útil", "🧰", ["util", "ferramenta", "ajuda"], undefined, "svg"),
  entry("salute", "Saudação", "🫡", ["saudacao", "respeito", "capitao"], undefined, "svg"),
  // O coração roxo da fileira de reações fica no FIM, e não logo depois do joinha: o pacote é uma
  // lista POSICIONAL (`reaction-figures.test.ts` fixa "a reação i é a figura i"), então inserir no
  // índice 1 empurrava as 75 reações seguintes uma casa e a pílula de cada uma passaria a mostrar o
  // rosto da vizinha. O seletor busca o coração por código (`heartPurpleSource`), não pela posição.
  entry(
    "heart_purple",
    "Coração roxo",
    "💜",
    ["coracao", "roxo", "amor", "curtir", "enois"],
    undefined,
    "svg",
  ),
];

const VARIATION_SELECTOR = /\uFE0F/g;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const unicodeMap = new Map<string, CustomEmojiEntry>();
const codeMap = new Map<string, CustomEmojiEntry>();

// A reação oficial do coração roxo usa o nome curto do arquivo (`heart_purple`); o código completo
// com que a figurinha é escrita no texto (`enois_heart_purple`) aponta para a mesma figura. O apelido
// fica só no código resolvido: o pacote segue com uma entrada por posição de reação.
for (const item of ENOIS_CUSTOM_EMOJIS) {
  codeMap.set(item.code, item);
  const candidates = [item.unicode, ...(item.unicodeAliases ?? [])].filter(
    (value): value is string => Boolean(value),
  );
  for (const symbol of candidates) {
    unicodeMap.set(symbol, item);
    const stripped = symbol.replace(VARIATION_SELECTOR, "");
    if (stripped && !unicodeMap.has(stripped)) {
      unicodeMap.set(stripped, item);
    }
  }
}

const sortedUnicodeKeys = [...unicodeMap.keys()].sort((a, b) => b.length - a.length);
const UNICODE_EMOJI_REGEX =
  sortedUnicodeKeys.length > 0
    ? new RegExp(sortedUnicodeKeys.map(escapeRegex).join("|"), "gu")
    : null;

// `heart_purple` é o nome curto do arquivo, o mesmo que a reação oficial do coração roxo usa; o
// código das figurinhas é o nome com que ele é escrito no texto. O apelido fica só na busca por
// código: o pacote continua com uma entrada por posição de reação.
(() => {
  const heartPurple = ENOIS_CUSTOM_EMOJIS.find((item) => item.src.endsWith("heart_purple.svg"));
  if (heartPurple) codeMap.set("heart_purple", heartPurple);
})();

export function getEnoisEmojiByCode(code: string): CustomEmojiEntry | undefined {
  return codeMap.get(code);
}

/** Resolve o asset de um código `:enois_*:` ou de um emoji Unicode salvo nos recentes. */
export function getEnoisEmojiSrc(codeOrUnicode: string): string | undefined {
  return codeMap.get(codeOrUnicode)?.src ?? unicodeMap.get(codeOrUnicode)?.src;
}

/**
 * Substitui emojis Unicode reais presentes em um trecho de texto (já fora de blocos de código)
 * pelas figurinhas personalizadas da Rede É Nóis em formato markdown inline `![alt](src)`.
 */
export function replaceUnicodeWithEnoisEmojis(text: string): string {
  if (!text || !UNICODE_EMOJI_REGEX) return text;
  return text.replace(UNICODE_EMOJI_REGEX, (match) => {
    const found = unicodeMap.get(match);
    return found ? `![${match}](${found.src})` : match;
  });
}

/** Filtra o pacote da É Nóis para o seletor de emojis/figurinhas. */
export function filterEnoisEmojis(query: string): readonly CustomEmojiEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return ENOIS_CUSTOM_EMOJIS;
  return ENOIS_CUSTOM_EMOJIS.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.code.toLowerCase().includes(normalized) ||
      item.unicode?.includes(normalized) ||
      item.keywords.some((kw) => kw.includes(normalized)),
  );
}
