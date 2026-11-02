import type { PushNavigateMessage } from "@/types/push/push-navigate-message";

/**
 * O tipo da mensagem que o service worker manda para a aba. O arquivo `public/sw.js` e JavaScript
 * puro (nao importa o app), entao a string mora nos dois lados — e o teste amarra as duas.
 */
export const PUSH_NAVIGATE = "enois:navigate";

/**
 * O service worker renova sozinho a inscricao quando o navegador a troca (troca de conta no
 * aparelho, limpeza do servico de push) e avisa a aba com a inscricao nova. Sem esse registro no
 * backend, a inscricao local continua valida e o servidor manda para o endpoint morto.
 */
export const PUSH_SUBSCRIPTION = "enois:push-subscription";

/**
 * Extrai o href que a aba deve traduzir (pela tabela de rotas do app). Devolve `null` quando a
 * mensagem nao e de navegacao — o worker tambem manda outras coisas.
 */
export function hrefDoPush(data: PushNavigateMessage | null | undefined): string | null {
  if (data?.type !== PUSH_NAVIGATE) return null;
  if (!data.href) return null;
  return data.href;
}

/** Inscricao renovada que o worker mandou para a aba, ou `null` quando a mensagem e outra. */
export function subscriptionDoPush(data: unknown): PushSubscriptionJSON | null {
  if (!data || typeof data !== "object") return null;
  const message = data as { type?: unknown; subscription?: unknown };
  if (message.type !== PUSH_SUBSCRIPTION) return null;
  const subscription = message.subscription as PushSubscriptionJSON | undefined;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth)
    return null;
  return subscription;
}
