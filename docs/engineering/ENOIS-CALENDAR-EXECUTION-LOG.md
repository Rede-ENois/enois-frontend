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

**PR:** nenhum nesta execução; a documentação foi entregue na execução 2, no PR #740.

**BLOQUEIOS:** B1 (clone do backend desatualizado), B2 (data como texto), B4 (design system privado
sem `read:packages` no token local), B5 (sem navegador para prova visual).

**PRÓXIMA EXECUÇÃO:** Fase 1 — modelo `calendar_entries` com início/fim tipados, `scope`, `kind`,
`time_zone_id`, unicidade de `source_ref` e índice de intervalo; migration a partir de V257; teste
de persistência e de consulta por intervalo.

---

## EXECUÇÃO 2

**DATA/HORA:** 2026-11-08, ~13:10 (America/Sao_Paulo)

**FASE:** 1 — fundação do calendário

**TAREFA:** modelo central do compromisso e consulta por intervalo (sem endpoint nesta unidade).

**REPOSITÓRIOS:** `enois-backend` (código), `enois-frontend` (documentação).

**ARQUIVOS:**
- `src/main/resources/db/migration/V257__calendar_entries.sql` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/domain/` — `CalendarEntry`, `CalendarScope`,
  `CalendarKind`, `CalendarEntryState`, `CalendarEntrySource`
- `src/main/java/com/socialcoisa/rede/calendar/application/port/out/CalendarEntryRepository.java`
- `src/main/java/com/socialcoisa/rede/calendar/adapters/out/persistence/` — entidade JPA, repositório
  Spring Data e adaptador
- `src/test/java/com/socialcoisa/rede/calendar/` — `CalendarEntryTests`, `CalendarEntryPersistenceTests`
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md`, `ENOIS-CALENDAR-ARCHITECTURE.md`,
  `ENOIS-CALENDAR-EXECUTION-LOG.md` (este arquivo)

**IMPLEMENTAÇÃO:**
- Tabela `calendar_entries` com início/fim em `timestamp`, `time_zone_id` IANA, `scope`, `kind`,
  `state`, origem (`source_type`/`source_id`) e carimbo de cancelamento. `CHECK` garante fim depois
  do início e origem sempre completa ou vazia. Índices `(owner_id, starts_at, state)` e
  `(source_type, source_id)`.
- Domínio com as invariantes: título e descrição limitados, duração máxima de 7 dias, fuso só se for
  id IANA conhecido, cancelado não aceita edição, reagendar para o mesmo horário não suja
  `updatedAt` (o que mantém o `SEQUENCE` do `.ics` estável), `overlaps()` meia-aberto dos dois lados.
- Consulta por janela meia-aberta com `scope` nulo devolvendo as duas agendas, e busca pela origem
  para o módulo que grava a entrada saber se já existe.
- Ajuste de decisão registrado em D3: a unicidade de origem não é índice único no banco porque
  entradas criadas no próprio calendário não têm origem, e no MySQL/MariaDB nulos não colidem; a
  sincronização externa (Fase 10) sempre nasce com origem preenchida.

**TESTES:** `./mvnw -o test -Dtest=...` — 20 testes, 0 falhas, 0 erros.
`CalendarEntryTests` 8/8, `CalendarEntryPersistenceTests` 5/5, `MariaDbReservedWordsTests` 2/2 e
`FlywayMigrationConfigTests` 5/5. A primeira rodada teve 1 falha no teste de janela: eu esperava a
ordem de inserção, e a consulta ordena por início; a expectativa foi corrigida (o comportamento
estava certo).

**PR:** [#531](https://github.com/Rede-ENois/enois-backend/pull/531) — aguardando revisão humana.
A documentação foi no PR [#740](https://github.com/Rede-ENois/enois-frontend/pull/740).

**BLOQUEIOS:** nenhum bloqueio novo. B1 resolvido com worktree novo a partir de `enois/qa`
(`b80e8571`). B2 e B3 já têm encaminhamento escrito; a migração de dados de `events` é uma unidade
própria e continua pendente.

**PRÓXIMA EXECUÇÃO:** Fase 1, segunda unidade — serviço de aplicação e endpoints de leitura
(`GET /calendar/entries?from=&to=&scope=`, `GET /calendar/entries/{id}`) com autorização por dono e
DTO de saída; teste de contrato com 401 sem sessão, 404 para entrada alheia e filtro de agenda.
