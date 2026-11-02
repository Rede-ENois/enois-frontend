/**
 * A faísca FRACIONADA.
 *
 * O backend inteiro conta MILÉSIMOS (1 faísca = 1.000 mf — como os centavos do real):
 * inteiro no banco/ledger (sem float), decimal na tela. Aqui ficam o formato, a leitura
 * do que a pessoa digita e a conversão para BRL pela cotação de referência.
 */
export const FAIS_SCALE = 1_000;

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

/** Milésimos → texto pt-BR ("105.000" mf = "105"; "1500" mf = "1,5"). */
export function formatFaisca(mf: number): string {
  if (!Number.isFinite(mf)) return "0";
  return nf.format(mf / FAIS_SCALE);
}

/**
 * O que a pessoa digitou → milésimos. Aceita "1.234,56" (pt-BR) e "1234.56":
 * quando há vírgula, o ponto é milhar; sem vírgula, o ponto vale como decimal.
 * Devolve null quando não dá para ler ou é ≤ 0.
 */
export function parseFaiscaInput(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * FAIS_SCALE);
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
