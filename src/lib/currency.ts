/**
 * Moeda da faixa salarial.
 *
 * O backend guarda o valor sem simbolo e o codigo ISO da moeda (`BRL`, `USD`, `EUR`); aqui a gente
 * remonta o texto com o simbolo certo — inclusive para vagas antigas, gravadas antes do campo
 * existir, que ainda tem "R$ 8.000" escrito no valor.
 */
import type { CurrencyCode } from "@/types/application/currency/currency-code";

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "BRL", symbol: "R$", label: "Real (R$)" },
  { code: "USD", symbol: "US$", label: "Dólar (US$)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
];

const SYMBOLS: Record<CurrencyCode, string> = { BRL: "R$", USD: "US$", EUR: "€" };

/** Qualquer simbolo digitado no valor sai: o simbolo vem sempre da moeda escolhida. */
const ANY_SYMBOL = /(R\$|US\$|\$|€)/gi;

export function normalizeCurrencyCode(currency: string | null | undefined): CurrencyCode {
  const code = (currency ?? "").toUpperCase();
  return code === "USD" || code === "EUR" ? code : "BRL";
}

export function currencySymbol(currency: string | null | undefined): string {
  return SYMBOLS[normalizeCurrencyCode(currency)];
}

/** "8.000 – 12.000" + BRL -> "R$ 8.000 – R$ 12.000". */
export function formatSalary(
  salary: string | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (!salary) return null;
  const value = salary.replace(ANY_SYMBOL, " ").replace(/\s+/g, " ").trim();
  if (!value) return null;
  const symbol = currencySymbol(currency);
  const parts = value.split(/\s*[–—-]\s*/);
  return parts.length === 2
    ? `${symbol} ${parts[0]} – ${symbol} ${parts[1]}`
    : `${symbol} ${value}`;
}
