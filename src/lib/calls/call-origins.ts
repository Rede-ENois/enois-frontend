/**
 * As origens do servidor de reunião (o Epapo) que a gente hospeda.
 *
 * É o mesmo endereço que o backend entrega em `join.host` (`REDE_CALLS_EPAPO_URL`, em QA e em
 * produção). Outro ambiente informa os seus em `VITE_CALLS_ORIGINS`, separadas por vírgula.
 *
 * Mora num arquivo só porque dois lados leem a mesma lista e não podem divergir: o cliente
 * (para decidir se abre o iframe) e o servidor (para decidir quais origens ganham câmera e
 * microfone no `Permissions-Policy`). Divergir aqui significa abrir a sala e não ter mídia.
 */
const DEFAULT_CALL_ORIGINS = ["https://meet.enois.ia.br"];

export function trustedCallOrigins(): string[] {
  const configured = (import.meta.env.VITE_CALLS_ORIGINS ?? "")
    .split(",")
    .map((origin: string) => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_CALL_ORIGINS;
}
