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
