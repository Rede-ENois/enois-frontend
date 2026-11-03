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

/**
 * Destino que o worker deixa na query quando a notificacao e aberta sem nenhuma aba do app
 * (`/?push=<href>`): sem aba nao ha quem traduza o href, e navegar direto para ele pode cair num
 * caminho do backend ("/api/...") ou num que nao existe. A traducao acontece no app, pela mesma
 * tabela da notificacao interna.
 *
 * So aceita caminho do proprio site: o href vem de fora e nao pode virar navegacao para outro
 * host.
 */
export function hrefDaQueryDePush(search: string): string | null {
  const href = new URLSearchParams(search).get("push");
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

/**
 * The tapped notification, to mark it read: from the worker message (`notificationId`) or from the
 * query the worker leaves when no tab was open (`n`). Ids are opaque, so only a plain token passes.
 */
export function notificationIdDoPush(
  source: PushNavigateMessage | string | null | undefined,
): string | null {
  const id =
    typeof source === "string"
      ? new URLSearchParams(source).get("n")
      : source?.type === PUSH_NAVIGATE
        ? source.notificationId
        : null;
  return id && /^[\w-]{1,128}$/.test(id) ? id : null;
}

/** A mesma query sem o destino, para o endereco nao guardar o clique na notificacao. */
export function searchSemPush(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("push");
  params.delete("n");
  return params.toString();
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
