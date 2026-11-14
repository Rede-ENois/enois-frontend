# Énóis Frontend — Log de execução (performance e responsividade)

> Um bloco por rodada, acrescentado no fim. Nunca sobrescrever um bloco anterior.
> "Concluído" só entra com a prova executada. Se não houver log anterior, este é o primeiro.

**Branch de trabalho:** `perf/front-responsividade-qa` (derivada da `qa`). Nunca commitar na `qa`
nem na `main`; nunca force push.

---

## RODADA 1 — cancelamento de requisição e debounce das buscas

**DATA/HORA:** 2026-11-13 (America/Sao_Paulo)

**FASE:** 1 (diagnóstico) e 2 (arquitetura assíncrona)

**DIAGNÓSTICO:**

- Busca de pessoas refeita a cada tecla, sem pausa e sem cancelar a anterior
  (`src/components/global-search.tsx`, `user-picker.tsx`, `company-edit-dialog.tsx`,
  `mention-textarea.tsx`). Resultado antigo podia resolver depois do novo e sobrescrevê-lo.
- `request()` em `src/lib/api-client.ts` nunca recebia `AbortSignal`: o TanStack entrega um por
  `queryFn` e ele morria ali.

**IMPLEMENTAÇÃO:**

- `src/types/application/api/request-options.ts`: `RequestOptions.signal?: AbortSignal`.
- `src/lib/api-client.ts`: `signal` repassado às 4 chamadas de `fetch`; abort rejeitado cedo,
  re-checado após `refreshIfNeeded()` e propagado sem virar `NETWORK_ERROR` nem refazer escrita.
- `src/lib/api/search.ts`, `src/lib/api/users.ts`: aceitam e repassam `signal`.
- `src/lib/use-debounced-value.ts` (novo) + uso com 250 ms nos quatro campos de busca.

**TESTES EXECUTADOS:**

- `src/lib/api-client.test.ts` — bloco "cancelamento da requisição" (4 casos).
- `src/lib/use-debounced-value.test.tsx` — 4 casos.
- `src/components/mention-textarea-state.test.tsx` — espera a pausa do debounce (asserção intacta).
- `src/lib/e2e/key-manager.test.ts` — teto de tempo do próprio arquivo elevado (RSA-2048 + PBKDF2
  600k é custo real; com a suíte em paralelo o teto padrão de 5s derrubava o teste por tempo, não
  por defeito). Sem enfraquecer asserção.

**PRÓXIMO PASSO:** validar a suíte inteira + lint + typecheck e commitar; em seguida a compressão de
vídeo no cliente e o pull-to-refresh das listagens.

**ESTADO:** em andamento.

---

## RODADA 2 — compressão e downscale de vídeo no cliente (teto de 10 MB da API)

**DATA/HORA:** 2026-11-13 (America/Sao_Paulo)

**FASE:** 3 (processamento/network) — reduzir bytes enviados e evitar upload recusado no fim.

**DIAGNÓSTICO:**

- A API recusa vídeo acima de 10 MB (`MediaService.MAX_VIDEO_BYTES`) e acima de 3 minutos. Um vídeo
  de celular de 30 s sai com 40–80 MB: a pessoa filmava, esperava o envio inteiro e levava a recusa
  só no fim.
- O app já tinha `checkVideoLimit` (tamanho + duração lidos no cliente), mas ele só RECUSAVA: não
  existia nenhuma redução antes do envio.

**IMPLEMENTAÇÃO:**

- `src/lib/compress-video.ts` (novo): recodificação sem dependência nova, com o que o navegador já
  tem (`<video>` decodifica, `canvas` redimensiona, `MediaRecorder` recodifica em WebM VP8/Opus).
  Escada de 4 degraus de resolução + bitrate (1280→480 px, 2 Mbps→400 kbps); para no primeiro que
  couber nos 10 MB. Se nem o menor couber, `VideoCompressionError`; se o navegador não souber
  recodificar, devolve o arquivo original e quem decide é o servidor.
  `scaledDimensions` mantém a proporção, nunca aumenta e força lados pares (exigência do VP8).
- `src/types/media-upload/video-compression-step.ts` (novo): tipo do degrau, no lugar que a regra
  `local/type-boundaries` exige.
- `src/lib/use-media-upload.ts`: a checagem de TAMANHO saiu da frente da compressão. Antes,
  `prepare()` lançava `VideoLimitError("size")` para qualquer vídeo acima do teto — e a compressão
  nunca rodava, porque o caminho só chegava nela quando o arquivo já cabia. Agora a duração continua
  sendo checada antes (recodificar não encurta minutos) e o tamanho é avaliado DEPOIS da compressão.

**TESTES EXECUTADOS:**

- `src/lib/compress-video.test.ts` — 10 casos (dimensões, suporte, primeiro degrau que cabe, queda
  pela escada, recusa no fim, progresso).
- `src/lib/use-media-upload.prepare.test.ts` — 5 casos, ordem da checagem de vídeo.
  **Prova de regressão:** com o `throw` de tamanho de volta na frente da compressão, o caso
  "comprime o vídeo grande em vez de recusar direto" falha (1 failed | 4 passed); com a correção,
  5/5. Executado nos dois estados, não inferido.

**DEFEITO ENCONTRADO NO CAMINHO (regra do escoteiro):**

- `src/components/edit-profile-dialog.test.tsx` falhava de forma determinística no caso "data nova de
  16 anos é aceita". A data era montada com `toISOString()` (UTC) enquanto a régua de idade corta
  pelo dia do calendário LOCAL: depois das 21h em Brasília o UTC já virou o dia seguinte, a data
  recuava um dia e a conta passava a ter 15 anos e 11 meses. O erro era do teste, não da regra; o
  conserto monta a data pelas partes locais (mesmo formato do helper `anosAtras` de
  `min-age.test.ts`). Prova: o mesmo caso falhava antes do conserto e passa (7/7) depois, na mesma
  máquina e no mesmo minuto. Nenhum outro arquivo de teste usa `toISOString` para data de idade.

**GATES:**

- `npm run lint` — 0 erros (14 avisos, todos anteriores a esta rodada).
- `npx tsc --noEmit` — exit 0.
- `npx vitest run` (suíte inteira) — **240 arquivos / 1400 testes, todos verdes** depois do conserto
  do defeito de fuso. (Antes do conserto o mesmo comando dava 1399/1400.)
- `npm run build` — exit 0 (`✓ built`), sem erro de compilação; os avisos de diretiva `"use client"`
  do `@tanstack/react-query` são anteriores a esta rodada.

**PRÓXIMO PASSO:** pull-to-refresh e atualização das notificações; separar a criptografia P2P da
thread principal.

**ESTADO:** em andamento.

---

## RODADA 3 — puxar para renovar na página de avisos

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 4 (mobile) — pull-to-refresh ausente/inconsistente entre as listas.

**DIAGNÓSTICO:**

- O gesto de puxar para renovar existia (`src/lib/feed/pull-to-refresh.ts`), mas com nome e lugar
  presos ao feed e usado SÓ em `src/routes/feed.tsx`. A página de avisos (`notificacoes.index.tsx`)
  não tinha nenhuma forma de atualizar a lista sem sair e voltar — a inconsistência do prompt
  ("pull-to-refresh ausente/inconsistente").

**IMPLEMENTAÇÃO:**

- `src/lib/feed/pull-to-refresh.ts` → `src/lib/pull-to-refresh.ts`, hook `useFeedPullToRefresh` →
  `usePullToRefresh` (mesmo corpo; só o nome e o comentário deixaram de ser do feed). O `onRefresh`
  é que define o que cada lista renova.
- `src/routes/notificacoes.index.tsx`: o gesto agora renova SÓ a lista de avisos (`list.refetch`),
  com o `PullIndicator` do design system como feedback (mesmo do feed). Sem markup novo: o wrapper
  `relative` reusa o elemento que já estava no arquivo.
- `src/texts.ts`: `notificationsPage.refreshing`.

**TESTES EXECUTADOS:**

- `src/routes/notificacoes.index.test.tsx` (novo, 2 casos): gesto no limite dispara nova busca;
  puxada curta não. **Prova de regressão:** com o gesto desligado (hook removido da página), o caso
  do gesto falha e o curto passa (1 failed | 1 passed); com o hook ligado, 2/2. Executado nos dois
  estados.
- `src/lib/pull-to-refresh.test.tsx` (6 casos, sem mudança de asserção) e
  `use-notifications-list.test.tsx` (5 casos) seguem verdes.

**GATES:**

- `npm run lint` — 0 erros (14 avisos, todos anteriores).
- `npx tsc --noEmit` — exit 0.
- `npx vitest run` — 241 arquivos, 1402 testes, 0 falhas.
- `npm run build` — verde (client + SSR + nitro, exit 0).

**PRÓXIMO PASSO:** renovação das conversas por gesto em `mensagens.tsx`; separar a criptografia P2P

da thread principal.

**ESTADO:** em andamento.

---

## RODADA 4 — puxar para renovar na lista de conversas

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 4 (mobile) — fechar o pull-to-refresh nas listagens.

**DIAGNÓSTICO:**

- O ganho tem de ser mais que repetir o gesto: a lista de conversas (`src/routes/mensagens.tsx`)
  rola DENTRO de um `<ul>` (o contêiner tem altura fixa `100dvh`), não na janela. O hook
  `usePullToRefresh` media o topo só por `window.scrollY === 0` — ali a página fica SEMPRE em 0,
  então qualquer arrasto para baixo "renovaria", mesmo com a lista já rolada. Ligar o gesto sem
  correr esse gate entregaria um comportamento errado, não uma melhoria.

**IMPLEMENTAÇÃO:**

- `src/lib/pull-to-refresh.ts`: terceiro parâmetro opcional `container` (`RefObject<HTMLElement>`).
  Com ele, o topo é o `scrollTop` do contêiner e o gesto só é reconhecido se o toque começar
  DENTRO dele (alvo que não é `Node`, como a janela, não conta). Sem ele, o comportamento do feed e
  dos avisos é o mesmo de antes.
- `src/routes/mensagens.tsx`: `ref` no `<ul>`, `usePullToRefresh` renovando só a caixa atual
  (`refetchConversations`), `PullIndicator` do design system como feedback e o wrapper virou
  `relative` para ancorar o indicador. Sem markup novo: reusa a `<ul>` e o `<div>` que já existiam.

**TESTES EXECUTADOS:**

- `src/lib/pull-to-refresh.test.tsx` — 8 casos (6 anteriores intactos + 2 novos: gesto que começa
  fora do contêiner não renova; contêiner já rolado não renova). **Prova de regressão:** com o gate
  antigo (`target instanceof Node &&`) o caso novo falha (1 failed | 7 passed); com o gate correto,
  8/8. Executado nos dois estados.
- Relacionados: `notificacoes.index.test.tsx` e `use-notifications-list.test.tsx` — 15/15 juntos.

**GATES:**

- `npx eslint` nos arquivos tocados — 0 erros.
- `npx tsc --noEmit` — exit 0.
- `npm run lint` — 0 erros (14 avisos, todos anteriores).
- `npx vitest run` — 241 arquivos, 1404 testes, 0 falhas.
- `npm run build` — verde (client + SSR + nitro, exit 0).

**PRÓXIMO PASSO:** guardas de clique duplo (criar conversa, ações que hoje aceitam dois envios).

**ESTADO:** em andamento.

---

## RODADA 5 — guarda contra o toque duplo ao abrir conversa

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 3 (interações) — pendência 3: ações que aceitam dois envios.

**DIAGNÓSTICO:**

- `src/routes/mensagens.tsx`: o botão da pessoa na busca chamava `createConversation.mutate()`
  sem nenhuma guarda. Dois toques antes da resposta criavam **duas conversas** com a mesma pessoa;
  o servidor só deduplica depois, e a caixa de entrada ficava com duas linhas iguais.
- O `disabled={mutation.isPending}` que o resto do app usa (vagas, perfil, candidatura) **não
  basta** aqui: `isPending` chega ao DOM só no render seguinte, e dois toques no mesmo tick passam
  os dois. O teste novo mostra isso — com só `disabled`, a mutação é chamada 2 vezes.

**IMPLEMENTAÇÃO:**

- `createRef` síncrono (`creatingRef`) no handler: o primeiro toque marca, o segundo retorna cedo;
  o `onSettled` solta a trava (sucesso ou erro, para uma falha não travar o botão).
- `disabled={createConversation.isPending}` mantido como feedback visual/teclado.

**TESTES EXECUTADOS:**

- `src/routes/mensagens.test.tsx` (novo): renderiza a rota com a criação EM CURSO, clica duas
  vezes na mesma pessoa e exige **uma** chamada a `messagesApi.createConversation`.
  **Prova de regressão:** sem o ref (só `disabled`), falha com "expected 1, got 2"; com o ref,
  1/1 verde. Executado nos dois estados.

**GATES:**

- `npx eslint` nos arquivos tocados — 0 erros; `npm run lint` — 0 erros (14 avisos, anteriores).
- `npx tsc --noEmit` — exit 0.
- `npx vitest run` — **242 arquivos, 1405 testes, 0 falhas**, rodado com `--cache.dir` proprio.
  Numa passada anterior a mesma suite marcou 1 falha num teste que **nao existe na arvore**
  (`carteira.test.tsx` "exibe a ordem de cada resposta"); `node_modules` aqui e um symlink para
  outro worktree e a arvore e compartilhada com outra sessao. Com cache separado e a arvore
  estavel, o arquivo passa 10/10 e a suite fecha limpa.
- `npm run build` — verde (client + SSR + nitro, exit 0).

**PRÓXIMO PASSO:** a mesma trava nas outras ações de um toque que ainda não têm guarda.

**ESTADO:** em andamento.

---

## RODADA 6 — decifragem E2E sem repetir o historico

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 3 (processamento) — pendencias 5 e 6: o custo de criptografia na thread.

**DIAGNOSTICO:**

- `src/lib/e2e/use-decrypted-messages.ts` decifrava TODA a lista a cada mudanca dela. A thread
  recebe um array novo sempre que uma pagina chega (mensagem nova, pagina anterior, reacao), e o
  efeito dispara por identidade do array: cada mensagem que entrava refazia o RSA-OAEP de todo o
  historico. Com 40 mensagens cifradas, uma linha nova custava 41 decifragens em vez de 1.
- Ja existia um conserto para o ciclo infinito (o `useMemo` em `conversation-thread.tsx`, que
  documenta os ~6 mil renders/s). O custo por chegada, nao o ciclo, e o que ficou.

**IMPLEMENTACAO:**

- `src/lib/e2e/use-decrypted-messages.ts`: cache do texto em claro por id de mensagem, guardando o
  ciphertext junto (mesmo id com conteudo diferente nao reaproveita). So o que ainda nao foi
  decifrado passa pelo `decryptReceived`.
- O cache e esvaziado ao trocar de conta (`currentUserId`), para uma conta nao ver texto decifrado
  pela anterior no mesmo aparelho. Exportado `clearDecryptedMessageCache()` para os testes.

**TESTES EXECUTADOS:**

- `src/lib/e2e/use-decrypted-messages.test.tsx` — 5 casos (3 anteriores intactos + 2 novos:
  mensagem nova decifra SO ela; id repetido com outro ciphertext e decifrado de novo).
  **Prova de regressao:** sem a consulta ao cache, "uma mensagem nova nao decifra o historico de
  novo" falha (1 failed | 4 passed); com o cache, 5/5. Executado nos dois estados.

**GATES:**

- `npx eslint` nos arquivos tocados — 0 erros; `npm run lint` — 0 erros (14 avisos, anteriores).
- `npx tsc --noEmit` — exit 0.
- `npx vitest run` — 242 arquivos, 1407 testes, 0 falhas.
- `npm run build` — verde (client + SSR + nitro, exit 0).

**PROXIMO PASSO:** pendencia 2 (contador do sino x resumo do servidor) depende do design system.

**ESTADO:** em andamento.

---

## RODADA 7 — criptografia E2E fora do chunk de entrada

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 6 (bundle) — pendencia 6: corte por rota; fatia pendente era o vazamento do modulo
E2E no chunk inicial.

**DIAGNOSTICO:**

- O aviso `[INEFFECTIVE_DYNAMIC_IMPORT]` do build mostrava `key-manager.ts` importado de forma
  estatica e dinamica ao mesmo tempo; o import dinamico nao dividia nada.
- O caminho estatico completo, provado por varredura do grafo de imports a partir da casca
  (`__root.tsx`): `__root → chat-dock → key-manager / conversation / e2e-setup-banner → crypto`.
  TODOS os 11 caminhos estaticos ate `crypto.ts` passam pelo dock de mensagens, montado direto no
  arquivo de entrada. 203 arquivos alcancaveis, incluindo os 29 exclusivos do dock (~96 KB de
  fonte: thread, lista, banner, emotes e todo o modulo E2E).
- Evidencia no build: `index-*.js` (438.031 B) importava `crypto-*.js` sincronamente e continha
  `enois-e2e` (IndexedDB das chaves), `RSA-OAEP` e `syncKeysOnLogin` — todo visitante baixava a
  criptografia, inclusive sem conta e sem nunca abrir uma conversa.

**IMPLEMENTACAO:**

- `src/components/chat-dock/chat-dock-mount.tsx` (novo): ponto de montagem barato que a casca
  importa. Ele so pede o chunk do dock por `lazy(() => import(...))` depois de montar e so para
  quem tem sessao (mesma condicao que o proprio dock ja usava). Visitante nao baixa nada do dock.
- `src/routes/__root.tsx`: `<ChatDock />` vira `<ChatDockMount />`. Nenhuma mudanca de
  comportamento no dock em si.
- Com o corte, o grafo estatico da casca cai de 203 para 175 arquivos e `crypto.ts`,
  `key-manager.ts` e `conversation.ts` deixam de ser alcancaveis estaticamente (provado pela
  mesma varredura).

**TESTES EXECUTADOS:**

- `src/lib/bundle-split.test.ts` (novo, 4 casos): varre o grafo de imports ESTATICOS a partir de
  `__root.tsx` e fixa que o modulo de criptografia, o gerenciador de chaves e a cifra de mensagens
  nao sao alcancaveis; que o ponto de montagem esta no caminho estatico mas o dock nao; e que a
  montagem usa `lazy(() => import(...))` (sem isso a aresta volta a ser estatica e o contrato cai
  por acidente).
  **Prova de regressao:** revertendo os dois pontos de `__root.tsx` ao import estatico antigo,
  3 dos 4 casos falham ("expected true to be false" x2 e "expected false to be true"); com o
  corte, 4/4. Executado nos dois estados.

**GATES:**

- `npx eslint` nos arquivos tocados — 0 erros; `npm run lint` — 0 erros (14 avisos, anteriores).
- `npx tsc --noEmit` — exit 0.
- `npx vitest run` — **243 arquivos, 1411 testes, 0 falhas** (cache proprio, arvore estavel).
- `npm run build` — verde. O aviso `[INEFFECTIVE_DYNAMIC_IMPORT]` SUMIU da saida. Chunk de
  entrada: 438.031 → **381.725 B** (-56 KB, -12,8%). Marcadores no chunk de entrada:
  `enois-e2e`, `RSA-OAEP`, `my-private-key`, `syncKeysOnLogin`, `PBKDF2` — todos de 1 ocorrencia
  para **0**. O crypto agora vive em chunk proprio (`crypto-*.js` + `key-manager-*.js`), atingido
  so pelos chunks de `mensagens`, `chat-dock`, `conversation-thread` e `entrar` (a referencia que
  resta no `index-*.js` e a tabela de preload do Vite, sem import sincrono).

**PROXIMO PASSO:** pendencia 1 fatia restante (pull-to-refresh na busca) ou pendencia 2
(contador do sino), que depende do design system.

**ESTADO:** em andamento.

---

## RODADA 8 — busca: o pull-to-refresh não se aplica (diagnóstico com evidência)

**DATA/HORA:** 2026-11-14 (America/Sao_Paulo)

**FASE:** 4 (gesto) — pendência 1, fatia restante: "resultados de busca".

**DIAGNOSTICO:**

- O critério pedia o gesto em "listas de notificações, mensagens e resultados de busca". As duas
  primeiras estão entregues (rodadas 3 e 4). A terceira não tem a superfície que o gesto exige.
- As buscas do app são TRÊS, todas superfícies de overlay, não listagens de página:
  1. `global-search.tsx` → `GlobalSearchView` do DS: os resultados saem num portal
     (`createPortal` sobre `document.body`) com `<ul className="max-h-80 overflow-y-auto">` e
     limite de 10 itens (`searchApi.search(..., 10)`), fechável por clique fora ou por rolar.
  2. `user-picker.tsx` → `UserPickerView`: menu de opções do campo, 6 itens.
  3. `company-edit-dialog.tsx` → `CompanyTeamSectionView`: lista de candidatos dentro de dialog.
- Pull-to-refresh é um gesto de LISTA DE PÁGINA: reconhece o arrasto para baixo com a página (ou o
  contêiner) no topo e renova aquela listagem. Num dropdown de 10 itens com altura máxima de
  20rem, que abre e fecha com a digitação e já revalida sozinho a cada termo (TanStack Query com
  `staleTime` padrão), o gesto não tem quando existir: não há "topo de lista" estável e a
  renovação já é automática a cada consulta. Implementá-lo aí seria enfeite sem função.
- As props do DS confirmam o desenho (`GlobalSearchProps`, `UserPickerProps`): não há hook de
  renovação nem superfície de rolagem de página nenhuma delas.

**DECISÃO:**

- Fatia "resultados de busca" da pendência 1: **não aplicável**, com a evidência acima. As
  superfícies de busca já renovam a cada termo (debounce 250 ms + cancelamento da anterior,
  rodada 1). A pendência 1 fica COMPLETA: feed (anterior), notificações (rodada 3), mensagens
  (rodada 4), busca (não aplicável, provado).

**TESTES EXECUTADOS:**

- Nenhum código mudou nesta rodada; a prova é a leitura do código-fonte citado
  (`dist/domain/search/global-search.js` do DS, `global-search.tsx`, `user-picker.tsx`,
  `company-edit-dialog.tsx`) e das props do DS. Nada a executar além da verificação de que os
  gates continuam verdes na árvore atual (rodada 7, commit `723e0fa5`).

**PROXIMO PASSO:** pendência 5 (criptografia fora da main thread com espera limitada) — a última
que não depende de terceiros. A pendência 2 segue bloqueada no design system (contador do sino
calculado dentro de `notifications-popover.js` 0.33.0).

**ESTADO:** em andamento.
