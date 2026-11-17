# Auditoria e otimização de performance do frontend Énóis

> **Escopo:** workspace do frontend (`connect-grow`), branch de trabalho `perf/front-responsividade-qa`
> (derivada da `qa`). O backend fica em outro repositório e é lido apenas para conferir contrato.
>
> **Ambiente:** QA somente. Produção é intocável por agente.
>
> **Regra:** este documento descreve o que **existe** no código, com arquivo:linha. Plano que ainda
> não foi implementado fica na seção "Pendências". Concluído só entra com prova executada.

---

## 1. Arquitetura assíncrona observada

### 1.1 Camada de dados

| Peça            | Arquivo                           | Observação                                                                      |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| Cliente HTTP    | `src/lib/api-client.ts`           | `request<T>()` central; retry em 429 (Retry-After), falha de rede e pós-refresh |
| Query Client    | `src/lib/query-client.ts`         | `staleTime: 30_000`, `refetchOnWindowFocus: true`, `retry: 1`                   |
| Chaves de query | `src/lib/query-options/`          | por domínio                                                                     |
| Pull-to-refresh | `src/lib/feed/pull-to-refresh.ts` | `TRIGGER_PX 70`, gate `scrollY === 0`, listeners passivos                       |

### 1.2 Problema raiz identificado — busca de usuário a cada tecla

Os campos de busca de pessoas disparavam a requisição a **cada caractere digitado**, sem pausa e
**sem cancelar a anterior**: o resultado da busca antiga (ou de uma tela que já saiu) resolvia
**depois** do resultado mais novo e podia sobrescrevê-lo.

Evidência (antes da correção):

- `src/components/global-search.tsx` — `queryFn: () => searchApi.search(query, ...)` sem debounce.
- `src/components/user-picker.tsx` — idem.
- `src/components/company-edit-dialog.tsx` — idem.
- `src/components/mention-textarea.tsx` — `onMentionQueryChange={setMentionQuery}` alimentava a query
  direto, sem pausa.

Consequências: rajada de requisições por palavra digitada, disputa de resposta ("stale data") e
consumo de rede/cota sem necessidade — exatamente os sintomas de "digitação travando" e "resultado
antigo voltando".

---

## 2. Correções aplicadas (com prova)

### 2.1 Cancelamento de requisição fim a fim

O `fetch` do navegador já sabe abortar; o app nunca pedia. Agora o `AbortSignal` que o TanStack
Query entrega a cada `queryFn` chega ao `fetch`.

- `src/types/application/api/request-options.ts` — `RequestOptions.signal?: AbortSignal`.
- `src/lib/api-client.ts` — `isAborted` / `isAbortError`; `request()` rejeita cedo se já abortado,
  repassa `signal` para as 4 chamadas de `fetch` (inicial, retry 429, retry de rede, retry pós-refresh)
  e **propaga o abort** sem convertê-lo em erro de rede nem refazer a escrita.
- `src/lib/api/search.ts`, `src/lib/api/users.ts` — aceitam e repassam `signal`.
- Consumidores (`global-search`, `user-picker`, `company-edit-dialog`, `mention-textarea`) passam
  `({ signal }) => ...`.

### 2.2 Debounce da busca de pessoas

- `src/lib/use-debounced-value.ts` (novo) — `useDebouncedValue<T>(value, delayMs)`.
- Aplicado com 250 ms nos quatro campos acima: a busca só sai depois da pausa.

### 2.3 Provas

- `src/lib/api-client.test.ts` — bloco "cancelamento da requisição": sinal chega ao `fetch`;
  nada é disparado se já abortado; abort é propagado (não vira `NETWORK_ERROR`); escrita cancelada
  é chamada uma única vez.
- `src/lib/use-debounced-value.test.tsx` — 4 testes do hook.
- `src/components/mention-textarea-state.test.tsx` — passa a esperar a pausa do debounce antes de
  procurar a lista de menção (asserção intacta; muda só o tempo de espera).

---

## 3. Pendências (não implementadas)

Estas são do escopo do pedido e ainda **não** têm correção com prova:

1. Pull-to-refresh nas listas de notificações, mensagens e resultados de busca (hoje só no feed).
2. Consistência do contador de notificações (sino vs resumo do servidor).
3. Guardas de clique duplo em ações que hoje podem disparar duas vezes (ex.: conectar no feed,
   criar conversa, salvar candidatura).
4. Compressão/downscale de vídeo no cliente antes do upload (teto 10 MB da API).
5. Criptografia de mensagem (E2E) fora da main thread e com espera limitada.
6. Virtualização de listas longas e corte de bundle por rota.

---

## 4. Como cada item é provado

- Cancelamento: teste de unidade do `api-client` (ver 2.3).
- Debounce: teste do hook + teste de tela do campo de menção.
- Mudanças de tela: receita de verificação visual do projeto (Chrome headless/Playwright) a 390px e
  desktop, sem depender de número inventado.

---

## 5. Nota de segurança

Nenhuma otimização aqui reduz parâmetro criptográfico, remove checagem de integridade, enfraquece
autenticação ou troca segurança por latência. O cancelamento descarta trabalho de rede; não mexe em
validação do servidor, que continua sendo quem recusa de verdade.
