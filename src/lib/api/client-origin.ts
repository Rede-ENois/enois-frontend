/**
 * Origem que o backend exige em TODA requisição.
 *
 * O navegador manda `Origin` sozinho, mas chamadas de servidor (SSR do Nitro, curl, integrações)
 * não mandam — por isso o front declara a origem pública do app explicitamente. No browser usamos
 * `window.location.origin` (funciona em prod, QA e dev); no SSR, a URL pública compilada no build.
 */
export function clientOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.VITE_SITE_URL ?? "https://enois.ia.br";
}

export function clientOriginHeader(): Record<string, string> {
  const origin = clientOrigin();
  return origin ? { "X-Client-Origin": origin } : {};
}
