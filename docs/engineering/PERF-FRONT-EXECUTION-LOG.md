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
