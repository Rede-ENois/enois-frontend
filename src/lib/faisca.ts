/**
 * A faísca FRACIONADA.
 *
 * O backend inteiro conta MILÉSIMOS (1 faísca = 1.000 mf — como os centavos do real):
 * inteiro no banco/ledger (sem float), decimal na tela. Aqui ficam o formato, a leitura
 * do que a pessoa digita e a conversão para BRL pela cotação de referência.
 *
 * Na tela o milésimo tem nome: 1.000 fagulhas formam 1 faísca, do mesmo jeito que 100 centavos
 * formam 1 real. "101.830" mf aparece como "101 faíscas 830 fagulhas" — quem lê "101,830" entende
 * cento e um mil e oitocentos e trinta, e a casa depois da vírgula deixa de ter significado.
 */
export const FAIS_SCALE = 1_000;

/** Quantas fagulhas formam uma faísca; é o divisor do resto, usado também nos textos. */
export const FAGULHAS_POR_FAISCA = FAIS_SCALE;

/**
 * Os nomes das duas unidades ficam aqui, e não em `texts`, porque `texts` já importa este módulo
 * (o saldo do menu da conta é formatado com `formatFaisca`). Importar de volta fecharia o ciclo.
 */
const UNIDADE_FAISCA = { singular: "faísca", plural: "faíscas" };
const UNIDADE_FAGULHA = { singular: "fagulha", plural: "fagulhas" };

function nomeUnidade(unidade: { singular: string; plural: string }, quantidade: number): string {
  return Math.abs(quantidade) === 1 ? unidade.singular : unidade.plural;
}

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Milésimos → as duas partes, ainda separadas: faíscas inteiras e o resto em fagulhas. */
export function partesFaisca(mf: number): { faiscas: number; fagulhas: number } {
  if (!Number.isFinite(mf)) return { faiscas: 0, fagulhas: 0 };
  // O extrato tem valor negativo; as fagulhas são sempre um resto positivo, então o sinal fica
  // só na parte inteira e o valor absoluto é o mesmo em qualquer aparelho.
  const arredondado = Math.round(mf);
  const sinal = arredondado < 0 ? -1 : 1;
  const total = Math.abs(arredondado);
  return { faiscas: Math.trunc(total / FAIS_SCALE) * sinal, fagulhas: total % FAIS_SCALE };
}

/**
 * Milésimos → texto em faíscas e fagulhas ("101.830" mf = "101 faíscas 830 fagulhas").
 * Só as partes que existem aparecem: "2.000" é "2 faíscas"; "830" é "830 fagulhas".
 */
export function formatFaisca(mf: number): string {
  const { faiscas, fagulhas } = partesFaisca(mf);
  const partes: string[] = [];
  // "0 faíscas 830 fagulhas" é ruído: a parte zerada não aparece, e o saldo pequeno fica legível.
  if (faiscas !== 0 || fagulhas === 0) {
    partes.push(`${nf.format(faiscas)} ${nomeUnidade(UNIDADE_FAISCA, faiscas)}`);
  }
  if (fagulhas > 0) {
    partes.push(`${nf.format(fagulhas)} ${nomeUnidade(UNIDADE_FAGULHA, fagulhas)}`);
  }
  return partes.join(" ");
}

/**
 * O que a pessoa digitou → milésimos. Aceita "1.234,56" (pt-BR) e "1234.56":
 * quando há vírgula, o ponto é milhar; sem vírgula, o ponto vale como decimal.
 * Devolve null quando não dá para ler ou é ≤ 0.
 *
 * O decimal aqui são FAGULHAS: "1,5" são 1.500 mf, ou seja, uma faísca e quinhentas fagulhas.
 */
export function parseFaiscaInput(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // O campo de edição é preenchido com `formatFaisca`, então o texto que ele mesmo escreve
  // ("101 faíscas 830 fagulhas") precisa voltar. Sem isso, abrir um item para editar e salvar
  // mandava zero.
  if (/faísca|fagulha/i.test(trimmed)) return parseUnidades(trimmed);
  const cleaned = trimmed.replace(/\s/g, "");
  const value = lerNumero(cleaned);
  if (value === null || value <= 0) return null;
  return Math.round(value * FAIS_SCALE);
}

/** "1.234,56" (pt-BR) ou "1234.56" → número. Com vírgula, o ponto é milhar. */
function lerNumero(text: string): number | null {
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const PARTE_EM_UNIDADE = /(-?\d[\d.,]*)\s*(faíscas?|fagulhas?)/gi;

/** "101 faíscas 830 fagulhas" → 101.830 mf. O sinal de `formatFaisca` vale para o total. */
function parseUnidades(text: string): number | null {
  const partes = [...text.matchAll(PARTE_EM_UNIDADE)];
  if (partes.length === 0) return null;
  // A string inteira tem de ser feita dessas partes: sobra de texto ("830 fagulhas5") é
  // digitação pela metade e não pode virar um valor menor em silêncio.
  const consumido = partes
    .map((parte) => parte[0])
    .join("")
    .replace(/\s/g, "");
  if (consumido !== text.replace(/\s/g, "")) return null;
  const sinal = partes[0][1].startsWith("-") ? -1 : 1;
  let total = 0;
  for (const [, numero, unidade] of partes) {
    // Com a unidade do lado o número é inteiro: "1.234 faíscas" são mil duzentas e trinta e
    // quatro, e "1,5 faíscas" são uma faísca e quinhentas fagulhas.
    const valor = lerNumero(numero.replace(/-/g, "").replace(/\./g, "").replace(",", "."));
    if (valor === null) return null;
    total += /^fagulha/i.test(unidade) ? Math.abs(valor) : Math.abs(valor) * FAIS_SCALE;
  }
  total *= sinal;
  return total > 0 ? Math.round(total) : null;
}

/**
 * Reais digitados ("1.234", "1.234,50") → reais inteiros. O freela em dinheiro guarda reais
 * inteiros; sem esta leitura o formulário multiplicava o valor por 1.000 (tratava como faísca).
 */
export function parseBrlInput(text: string): number | null {
  const cleaned = text.trim().replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  // Sem vírgula, "1.500" é milhar pt-BR (e não 1,5) — o padrão de grupo é o único caso em que o
  // ponto sozinho conta como separador de milhar; "1500.50" continua decimal.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

/** Centavos de real → "R$ 1,00". */
export function formatBrlCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Milésimos de faísca → centavos de real, pela cotação (centavos por 1 faísca). */
export function faiscaToBrlCents(mf: number, brlCentsPerFaisca: number): number {
  return Math.round((mf / FAIS_SCALE) * brlCentsPerFaisca);
}

/** Milésimos de faísca → micro-reais, pela cotação precisa (1 centavo = 10.000 µ). */
export function faiscaToBrlMicros(mf: number, brlMicrosPerFaisca: number): number {
  return Math.round((mf / FAIS_SCALE) * brlMicrosPerFaisca);
}

/** Micro-reais → "R$ 0,0102" (até 4 casas, o suficiente para a cotação fracionada). */
export function formatBrlMicros(micros: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(micros / 1_000_000);
}
