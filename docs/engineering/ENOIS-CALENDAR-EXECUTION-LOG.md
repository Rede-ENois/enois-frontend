# Énóis Calendar — Log de execução

> Um bloco por execução horária, acrescentado no fim. Nunca sobrescrever um bloco anterior.
> "Concluído" só entra aqui com a prova correspondente executada.

---

## EXECUÇÃO 1

**DATA/HORA:** 2026-11-08, ~09:40 (America/Sao_Paulo)

**FASE:** 0 — inventário e planejamento

**TAREFA:** inspeção dos repositórios, matriz de funcionalidades, dívida de data/hora, roadmap e
arquitetura.

**REPOSITÓRIOS:** `enois-backend` (leitura), `enois-frontend` (leitura),
`enois-design-system` (leitura do pacote publicado).

**ARQUIVOS:**
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md` (novo)
- `docs/engineering/ENOIS-CALENDAR-ARCHITECTURE.md` (novo)
- `docs/engineering/ENOIS-CALENDAR-EXECUTION-LOG.md` (novo)

**IMPLEMENTAÇÃO:**
- Backend: mapeados 41 pacotes; identificados como base o outbox transacional, os 42 workers
  `@Scheduled`, o módulo `notifications` com `NotificationCreatedEvent`, `calls` com `event_id`
  (V256) e `mentoring` com `MentorSlot` tipado em `Instant`.
- Encontrada a dívida raiz: `events.domain.Event` guarda `date` e `time` como `String`
  (`events/domain/Event.java:6-7`), com parser tolerante em `expiresAt()`; o tipo do front é o mesmo
  (`src/types/application/event/event.ts`). Sem intervalo, sem fuso, sem duração.
- Frontend: 69 rotas, nenhuma de agenda; menu em `src/components/navigation-items.ts`, proteção em
  `src/lib/require-auth.ts:20`, módulo em `src/lib/module-paths.ts:16`.
- Design System: `domain/events/recurrence` já existe e será reusado; não existe date picker,
  visão de calendário, seletor de fuso ou de disponibilidade.
- Registrado o bloqueio B1: o clone local do backend está 977 commits atrás da `qa`; toda leitura
  passou a ser por `git show enois/qa:`.

**TESTES:** nenhum nesta execução — foi levantamento, sem código de produto.

**PR:** nenhum. Documentação de planejamento; será entregue junto com a primeira unidade de código
da Fase 1, para não abrir PR só de documento.

**BLOQUEIOS:** B1 (clone do backend desatualizado), B2 (data como texto), B4 (design system privado
sem `read:packages` no token local), B5 (sem navegador para prova visual).

**PRÓXIMA EXECUÇÃO:** Fase 1 — modelo `calendar_entries` com início/fim tipados, `scope`, `kind`,
`time_zone_id`, unicidade de `source_ref` e índice de intervalo; migration a partir de V257; teste
de persistência e de consulta por intervalo.
