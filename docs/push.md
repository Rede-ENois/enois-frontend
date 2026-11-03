# Web push

Notificações push no navegador, sem app nativo.

## Fluxo

1. O usuário liga o push em **Configurações → Uso saudável**, na aba "Notificações e avisos"
   ([`use-push-state.ts`](../src/components/notifications/use-push-state.ts); o interruptor pede
   permissão do navegador e registra o service worker).
2. O front envia a assinatura push ao backend, que guarda a inscrição por dispositivo.
3. Quando uma notificação in-app nasce, o backend envia o push (Web Push com VAPID) para cada
   inscrição ativa do usuário.
4. O [service worker](../public/sw.js) recebe o push e mostra a notificação; o clique abre a URL
   da notificação (o mesmo mapeamento de href das notificações in-app).
5. The payload carries `notificationId`. On click, an open tab gets it in the `push-navigate`
   message; otherwise the app opens with `?push=<url>&n=<id>`. Either way `useMarkPushRead`
   (`src/lib/notification-read-cache.ts`) marks that notification as read, so opening a push clears
   it from the bell and the menu signals. `n` is validated (`notificationIdDoPush`) and dropped from
   the URL after use.

6. Mensagens: o backend manda um push por mensagem com `tag` = `conversation:{id}`; o service
   worker mostra com essa tag e `renotify`, então o push novo substitui o anterior da mesma conversa
   na bandeja em vez de empilhar. Com a conversa aberta e visível, o filão
   ([`use-conversation-on-screen.ts`](../src/lib/use-conversation-on-screen.ts)) manda o heartbeat
   `POST /conversations/{id}/viewing` a cada 20s (e `DELETE` ao sair da tela ou ir para o fundo):
   enquanto vale, mensagens dela não viram notificação nem push. O mesmo hook marca a conversa como
   lida (as notificações dela também) e fecha os pushes dela que ficaram na bandeja deste aparelho.

## Estados

- Permissão negada no navegador → o toggle mostra como reativar nas configurações do site.
- O interruptor de avisos deste aparelho e as categorias (social, mensagens, grupos, vagas,
  sistema) e o resumo semanal vivem juntos dentro do **Uso saudável** e em
  `/notificacoes/preferencias` (mesmo componente;
  [`notification-preferences-panel.tsx`](../src/components/notifications/notification-preferences-panel.tsx)).
  O menu da conta não repete mais esses itens.
- Inscrição expirada (410 do navegador) → o backend descarta e o push para de sair até religar.
- Sem chave VAPID configurada no ambiente → o toggle não aparece (o recurso fica desligado).

## Testes

A inscrição e o envio são testados no backend; no front, o fluxo visível é o interruptor dentro do
Uso saudável e a notificação do sistema operacional (testável em qualquer navegador com service
worker). Os estados do interruptor têm teste em
[`notification-preferences-panel.test.tsx`](../src/components/notifications/notification-preferences-panel.test.tsx).
