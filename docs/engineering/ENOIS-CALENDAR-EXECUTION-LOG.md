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

**PR:** [#531](https://github.com/Rede-ENois/enois-backend/pull/531) — mergeado em `6ac79d83`.
A documentação foi no PR [#740](https://github.com/Rede-ENois/enois-frontend/pull/740), mergeado em
`6765a46a`.

**BLOQUEIOS:** nenhum bloqueio novo. B1 resolvido com worktree novo a partir de `enois/qa`
(`b80e8571`). B2 e B3 já têm encaminhamento escrito; a migração de dados de `events` é uma unidade
própria e continua pendente.

**PRÓXIMA EXECUÇÃO:** Fase 1, segunda unidade — serviço de aplicação e endpoints de leitura
(`GET /calendar/entries?from=&to=&scope=`, `GET /calendar/entries/{id}`) com autorização por dono e
DTO de saída; teste de contrato com 401 sem sessão, 404 para entrada alheia e filtro de agenda.

---

## EXECUÇÃO 3

**DATA/HORA:** 2026-11-08, 08:11 a 08:45 (America/Sao_Paulo)

**FASE:** 1 — fundação do calendário

**TAREFA:** leitura da agenda: serviço de aplicação, `GET /calendar/entries` e
`GET /calendar/entries/{id}` com autorização por dono (sem criação/edição).

**REPOSITÓRIOS:** `enois-backend` (código), `enois-frontend` (documentação).

**ARQUIVOS:**

- `src/main/java/com/socialcoisa/rede/calendar/application/CalendarQueryService.java` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryController.java` (novo)
- `src/test/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryReadApiTests.java` (novo)
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md`, `ENOIS-CALENDAR-ARCHITECTURE.md`,
  `ENOIS-CALENDAR-EXECUTION-LOG.md` (este arquivo)

**IMPLEMENTAÇÃO:**

- `GET /calendar/entries?from=&to=&scope=`: janela meia-aberta sobre as entradas do dono da sessão.
  `scope` ausente devolve as duas agendas (visão consolidada composta na consulta, não uma terceira
  agenda). `from`, `to` ausentes, no formato errado ou com janela invertida viram 400
  `INVALID_WINDOW`; agenda fora de `SOCIAL`/`PROFESSIONAL` vira 400 `INVALID_SCOPE`.
- `GET /calendar/entries/{id}`: detalhe do próprio compromisso. Entrada de outra pessoa responde o
  mesmo 404 `CALENDAR_ENTRY_NOT_FOUND` de um identificador inexistente, para não confirmar que o id
  existe.
- Autorização pelo `CurrentUserResolver` existente: sem sessão é 401 nas duas rotas, antes de tocar
  o banco.
- Saída pelo DTO `CalendarEntryView`, com instantes ISO-8601 UTC, `timeZoneId` do organizador e
  `cancelledAt`; a entidade e o `ownerId` não saem no corpo.
- Decisão registrada como D10 na arquitetura: a consulta devolve o cancelado na janela
  (`state=CANCELLED`), porque a tela e o `.ics` precisam mostrar o que foi desmarcado.
- Observação de fluxo: o PR #531 foi mergeado como squash e a branch antiga ficou com o conteúdo
  duplicado. Esta unidade foi aplicada numa branch nova a partir da `qa` (`6ac79d83`), não na branch
  do #531.

**TESTES:** `./mvnw -o test -Dtest=CalendarEntryReadApiTests` — 9 testes, 0 falhas, 0 erros,
executados na árvore final sobre a `qa` `6ac79d83`. Cobrem 401 nas duas rotas sem sessão, isolamento
entre donos na lista e no detalhe, filtro por agenda e consolidada, janela meia-aberta dos dois lados
(termina no início e começa no fim não aparecem; atravessa aparece), 404 sem enumeração, campos do
contrato sem `ownerId`, os quatro casos de 400, compromisso cancelado e o alias `/v1`.
Os 20 testes de domínio e persistência da execução 2 continuam verdes.

**PR:** [#536](https://github.com/Rede-ENois/enois-backend/pull/536) — aguardando revisão humana.
Documentação no PR [#742](https://github.com/Rede-ENois/enois-frontend/pull/742), que declara a
dependência do #536.

**BLOQUEIOS:** nenhum novo. B5 segue valendo: esta unidade é só API, sem tela, então não houve
verificação visual. A migração de dados de `events` (B2) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** Fase 1, terceira unidade — `POST /calendar/entries`, `PATCH` e `DELETE`
(cancelamento) com validação do corpo, `Idempotency-Key` no padrão do repositório e autorização por
dono; testes de contrato de 201, 400, 404, idempotência e cancelamento. Sem convites ainda.

---

## EXECUÇÃO 4

**DATA/HORA:** 2026-11-08, 09:11–09:35 (America/Sao_Paulo)

**FASE:** 1 — fundação do calendário

**TAREFA:** criação, edição e cancelamento da entrada: `POST /calendar/entries`,
`PATCH /calendar/entries/{entryId}` e `DELETE /calendar/entries/{entryId}`, com validação do corpo,
`Idempotency-Key` e autorização por dono.

**REPOSITÓRIOS:** `enois-backend` (código), `enois-frontend` (documentação).

**ARQUIVOS:**

- `src/main/java/com/socialcoisa/rede/calendar/application/CalendarCommandService.java` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryController.java`
  (as três rotas de escrita, `CalendarEntryRequest` e `CalendarEntryPatchRequest`)
- `src/test/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryWriteApiTests.java` (novo)
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md`, `ENOIS-CALENDAR-ARCHITECTURE.md` (D11, D12),
  `ENOIS-CALENDAR-EXECUTION-LOG.md` (este arquivo)

**IMPLEMENTAÇÃO:**

- `CalendarCommandService` concentra criação, edição parcial e cancelamento. Toda violação de
  invariante do domínio (`IllegalArgumentException`) vira **400 `INVALID_CALENDAR_ENTRY`** com a
  mensagem do domínio, que já é escrita para quem usa o app; tentar editar entrada cancelada
  (`IllegalStateException`) vira **409 `CALENDAR_ENTRY_CANCELLED`**.
- Criação com padrão para `scope` (`SOCIAL`) e `kind` (`PERSONAL`), origem vazia (a rota é só para
  compromisso criado no próprio calendário; quem grava de outro módulo usa o serviço com a origem
  preenchida), `startsAt`/`endsAt` em ISO-8601 UTC e `timeZoneId` IANA. Id `cal_` + UUID.
- Edição é parcial: campo ausente não muda; `description` em branco limpa o texto; trocar horário
  exige `startsAt` e `endsAt` juntos, e trocar o fuso exige o intervalo junto. Reagendar para o
  mesmo horário não mexe em `updatedAt` (o `SEQUENCE` do `.ics` fica estável).
- `DELETE` cancela: a linha continua, sai com `state=CANCELLED` e `cancelledAt`. Cancelar de novo
  devolve 200 com o estado atual, sem mexer no carimbo, porque repetir o clique depois de um
  timeout não é erro.
- As três rotas passam pelo `IdempotencyApplicationService` com a chave do repositório (método +
  rota + `Idempotency-Key` + hash do corpo): repetir a criação com a mesma chave devolve a
  resposta guardada, e a mesma chave com corpo diferente dá **409 `IDEMPOTENCY_PAYLOAD_CONFLICT`**.
- Autorização: `currentUserResolver.resolve(...)` em todas; entrada de outra pessoa e id
  inexistente devolvem o mesmo **404 `CALENDAR_ENTRY_NOT_FOUND`**.

**TESTES:** `./mvnw -o test -Dtest=...` na árvore final (worktree `feat/enois-calendar-escrita`
sobre a `qa` `3a803a01`) — 40 testes, 0 falhas, 0 erros: `CalendarEntryWriteApiTests` 9/9,
`CalendarEntryReadApiTests` 9/9, `CalendarEntryTests` 8/8, `CalendarEntryPersistenceTests` 5/5,
`MariaDbReservedWordsTests` 2/2, `FlywayMigrationConfigTests` 5/5 e `AutomatedWritePathsTests` 2/2
(este último confirma que as rotas novas de escrita nascem protegidas por sessão). A primeira
rodada da suíte nova passou de primeira; a única correção no caminho foi uma acentuação na
asserção de mensagem.

**PR:** backend — [#538](https://github.com/Rede-ENois/enois-backend/pull/538), aguardando revisão
humana. Documentação — [#744](https://github.com/Rede-ENois/enois-frontend/pull/744), depende do #538.

A CI do #538 fechou verde: `Testes (PR)`, `Validar build (PR)`, `Schema x migrations`, CodeQL e
snyk passaram; deploy não roda em PR.

A CI do #541 fechou verde: `Testes (PR)` (9m18s), `Validar build (PR)`, `Schema x migrations`, CodeQL
e snyk passaram.

**BLOQUEIOS:** nenhum bloqueio novo. B2 (migração de dados de `events`) continua pendente como
unidade própria. B5 continua valendo: esta unidade é só API, sem tela, então não há verificação a
390px/1280px a registrar. A tela entra na Fase 3, quando existir o componente da Fase 2.

**PRÓXIMA EXECUÇÃO:** Fase 1, quarta unidade — **convites e participantes**: tabela
`calendar_entry_participants` (estado por participante: convidado, aceito, recusado, talvez),
`POST /calendar/entries/{entryId}/participants` e `PATCH .../participants/{userId}` restritos ao
dono, leitura da agenda incluindo os compromissos em que a pessoa é participante, e verificação de
que o convidado não edita a entrada do organizador. Testes de contrato: 201 convidando, 409 convite
repetido, 404 para convite de entrada alheia, 403 para o convidado respondendo convite de terceiro e
a entrada aparecendo para o convidado com o estado do convite.

---

## EXECUÇÃO 5

**DATA/HORA:** 2026-11-08, 10:10–10:40 (America/Sao_Paulo)

**FASE:** 1 — fundação do calendário

**TAREFA:** convites e participantes do compromisso: tabela `calendar_entry_participants`, convite
pelo @, resposta de quem foi convidado, remoção pelo organizador e a agenda de cada pessoa
passando a incluir o que ela foi convidada a participar.

**REPOSITÓRIOS:** `enois-backend` (código), `enois-frontend` (documentação).

**ARQUIVOS:**

- `src/main/resources/db/migration/V258__calendar_entry_participants.sql` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/domain/` — `CalendarParticipant`,
  `CalendarParticipantState`
- `src/main/java/com/socialcoisa/rede/calendar/application/` — `CalendarInvitationService` (novo),
  `CalendarAgendaItem` (novo), `CalendarQueryService` (`agenda(...)`), `port/out/CalendarParticipantRepository`
- `src/main/java/com/socialcoisa/rede/calendar/adapters/out/persistence/` — entidade JPA,
  repositório Spring Data e adaptador dos participantes; consulta por janela por conjunto de ids
  na entrada
- `src/main/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryController.java` —
  rotas de convite e `AgendaItemView`
- `src/test/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarInvitationApiTests.java` (novo)
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md`, `ENOIS-CALENDAR-ARCHITECTURE.md` (D13, D14),
  `ENOIS-CALENDAR-EXECUTION-LOG.md` (este arquivo)

**IMPLEMENTAÇÃO:**

- Tabela `calendar_entry_participants` com estado por pessoa (`INVITED`, `ACCEPTED`, `DECLINED`,
  `TENTATIVE`), unicidade `(entry_id, user_id)`, quem convidou e os carimbos de convite e resposta.
  Sem chave estrangeira, como no resto do repositório. Índice por compromisso e por pessoa.
- `CalendarParticipant` recusa convite para o próprio dono, recusa resposta `INVITED` (pendente não
  é resposta) e responder duas vezes a mesma coisa não mexe no carimbo.
- Rotas novas: `POST /calendar/entries/{entryId}/participants` (só o organizador, pelo @, com
  `Idempotency-Key`), `GET .../participants` (só o organizador), `PATCH .../participants/me` (quem
  responde é tirado da sessão, nunca do caminho) e `DELETE .../participants/{participantId}`
  (organizador remove). O `@` vem do perfil; a resposta não devolve id de pessoa.
- Convite para perfil inexistente é 404, convite repetido é 409, convite para entrada cancelada é
  409, responder convite alheio ou de terceiro é 404.
- A leitura da agenda (`GET /calendar/entries`) passou a devolver o compromisso mais o lugar de quem
  lê: `{ entry, owner, participation }`. O convidado vê o compromisso do organizador com o estado
  do próprio convite; o organizador vê `owner=true` e `participation=null`.
- O convidado **não** edita nem cancela a entrada do organizador: as rotas de escrita continuam
  respondendo 404, como respondiam antes de existir convite.

**TESTES:** `./mvnw -o test -Dtest=...` na árvore final (worktree `feat/enois-calendar-convites`
sobre a `qa` `422d852e`) — 51 testes, 0 falhas, 0 erros: `CalendarInvitationApiTests` 11/11,
`CalendarEntryReadApiTests` 9/9 (atualizados para o formato `{ entry, ... }`),
`CalendarEntryWriteApiTests` 9/9, `CalendarEntryTests` 8/8, `CalendarEntryPersistenceTests` 5/5,
`MariaDbReservedWordsTests` 2/2, `FlywayMigrationConfigTests` 5/5 e `AutomatedWritePathsTests` 2/2.
Nenhuma rodada precisou de conserto: a suíte de convites passou de primeira.

**PR:** backend [#541](https://github.com/Rede-ENois/enois-backend/pull/541), aguardando revisão
humana. Documentação [#745](https://github.com/Rede-ENois/enois-frontend/pull/745), depende do #541.

A CI do #541 fechou verde: `Testes (PR)` (9m18s), `Validar build (PR)`, `Schema x migrations`, CodeQL
e snyk passaram.

**BLOQUEIOS:** nenhum bloqueio novo. B2 (migração de dados de `events`) continua pendente como
unidade própria. B5 continua valendo: unidade só de API, sem tela, então não há verificação a
390px/1280px a registrar.

**PRÓXIMA EXECUÇÃO:** Fase 1, quinta unidade — **fechamento da fundação**: `GET /calendar/entries/{id}`
passa a devolver o mesmo lugar do leitor (dono ou convidado, com a lista de participantes para o
dono), e entra a listagem de convites pendentes (`GET /calendar/invitations?state=INVITED`) para a
tela conseguir mostrar "você foi convidado" sem varrer a agenda; testes de contrato do detalhe para
convidado (200, sem convidados expostos) e de convite pendente. Com isso a Fase 1 fecha e a Fase 2
(Design System) começa na execução seguinte.

---

## EXECUÇÃO 6

**DATA/HORA:** 2026-11-08, 11:10–11:55 (America/Sao_Paulo)

**FASE:** 1 — fundação do calendário (última unidade; fase fechada)

**TAREFA:** fechamento da fundação. `GET /calendar/entries/{id}` passa a devolver o lugar de quem
lê (dono com a lista de participantes, convidado com a própria resposta e sem a lista) e entra
`GET /calendar/invitations` com os convites que a pessoa ainda não respondeu.

**REPOSITÓRIOS:** `enois-backend` (código), `enois-frontend` (documentação).

**ARQUIVOS:**

- `src/main/java/com/socialcoisa/rede/calendar/application/CalendarQueryService.java` — `detail(...)`
- `src/main/java/com/socialcoisa/rede/calendar/application/CalendarInvitationService.java` —
  `pendingInvitations(...)`
- `src/main/java/com/socialcoisa/rede/calendar/application/port/out/CalendarParticipantRepository.java`
  e `adapters/out/persistence/` — `findPendingByUser`, consulta por pessoa e estado
- `src/main/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarEntryController.java` —
  `AgendaDetailView` e o detalhe com participantes
- `src/main/java/com/socialcoisa/rede/calendar/adapters/in/web/CalendarInvitationsController.java` (novo)
- `src/test/java/.../CalendarDetailAndPendingInvitationsApiTests.java` (novo),
  `CalendarEntryReadApiTests.java` e `CalendarEntryWriteApiTests.java` (formato novo do detalhe)
- `docs/engineering/ENOIS-CALENDAR-ROADMAP.md`, `ENOIS-CALENDAR-ARCHITECTURE.md` (D15),
  `ENOIS-CALENDAR-EXECUTION-LOG.md` (este arquivo)

**IMPLEMENTAÇÃO:**

- O detalhe passou a devolver `{ entry, owner, participation, participants }`, o mesmo vocabulário
  do item da agenda. `participants` vem preenchido só para o organizador; para o convidado é nulo.
- O convidado lê o compromisso do organizador com `owner=false` e o estado do próprio convite, e
  continua recebendo 404 em toda rota de escrita, como já recebia.
- Quem não organiza nem foi convidado recebe o mesmo 404 `CALENDAR_ENTRY_NOT_FOUND` de um id que não
  existe, tanto no detalhe quanto numa entrada hipotética.
- `GET /calendar/invitations` devolve os compromissos ativos em que a pessoa está em `INVITED`, do
  convite mais antigo ao mais novo. Entrada cancelada sai da lista. Sem sessão é 401, e o alias
  `/v1` serve o mesmo contrato.
- Nenhuma migration nesta unidade: as linhas de participante e os índices já existiam desde a V258.

**TESTES:** `./mvnw -o test -Dtest='Calendar*Tests,MariaDbReservedWordsTests,FlywayMigrationConfigTests,AutomatedWritePathsTests'`
na árvore final (worktree `feat/enois-calendar-detalhe` sobre a `qa` `358acbcc`) — 9 classes,
**57 testes, 0 falhas, 0 erros**: `CalendarDetailAndPendingInvitationsApiTests` 6/6 (novo),
`CalendarInvitationApiTests` 11/11, `CalendarEntryReadApiTests` 9/9, `CalendarEntryWriteApiTests`
9/9, `CalendarEntryTests` 8/8, `CalendarEntryPersistenceTests` 5/5, `MariaDbReservedWordsTests` 2/2,
`FlywayMigrationConfigTests` 5/5 e `AutomatedWritePathsTests` 2/2.

A primeira rodada teve 1 falha, e era do contrato antigo: `CalendarEntryWriteApiTests` ainda lia o
detalhe no formato plano (`$.id`, `$.title`). A asserção foi atualizada para `$.entry.*` mais
`$.owner`; nenhum código de produção mudou por causa dela.

**PR:** backend [#542](https://github.com/Rede-ENois/enois-backend/pull/542), aguardando revisão
humana. Documentação [#746](https://github.com/Rede-ENois/enois-frontend/pull/746), que declara a
dependência do #542.

A CI do #542 fechou verde: `Testes (PR)` (7m28s), `Validar build (PR)`, `Schema x migrations`,
CodeQL (java-kotlin, javascript-typescript, actions, python) e snyk passaram; os jobs de build e
deploy ficaram em `skipping`, como é o esperado num PR para a `qa`.

**BLOQUEIOS:** nenhum bloqueio novo. B2 (migração de dados de `events`, colunas de data em texto)
continua pendente como unidade própria e não impede nenhuma fase; fica registrada para não virar
esquecimento. B5 continua valendo: unidade só de API, sem tela, então não há verificação a 390px e
1280px a registrar.

**PRÓXIMA EXECUÇÃO:** Fase 2 — Design System. Primeira unidade no repositório
`Rede-ENois/enois-design-system`: componentes de calendário (mês, semana, dia, lista) e a alternância
entre as visões, com tipos em `src/types/domain/calendar/`, microcópia por `useMessages()` e nenhuma
chamada de API dentro do componente. Prova: `npm run build`, `npm run typecheck`, `npm run lint` e
`npm test` no DS; publicar a versão e atualizar o lock do front na mesma entrega.

---

## Execução 7

**EXECUÇÃO:** 7

**DATA/HORA:** 2026-11-08T13:35:00-03:00

**FASE:** 2 (Design System) — primeira unidade

**TAREFA:** visão de mês, semana, dia e lista no design system, com a alternância entre elas, tipos
em `src/types/domain/calendar/`, microcópia por `useMessages()` e nenhuma chamada de API dentro do
componente.

**REPOSITÓRIOS:**

- `Rede-ENois/enois-design-system` (código), worktree `/tmp/wt-ds-calendar`, branch
  `feat/calendar-views` a partir da `qa` `3f7a756` (versão 0.29.9).
- `Rede-ENois/enois-frontend` (esta documentação), worktree `/tmp/wt-calendar-docs6`, branch
  `docs/enois-calendar-execucao-7` a partir da `qa` `eb80d9e2`.

**ARQUIVOS:** no DS, 38 arquivos novos ou alterados (2136 linhas):

- `src/types/domain/calendar/` — 21 arquivos, um tipo por arquivo.
- `src/types/messages/calendar-messages.ts` e os dois registros (`messages.ts`, `default-messages.ts`).
- `src/messages/defaults/calendar.ts` — microcópia em pt-BR.
- `src/lib/calendar/` — `calendar-dates.ts`, `calendar-grid.ts`, `calendar-period.ts`,
  `calendar-kind-tone.ts`.
- `src/domain/calendar/` — `calendar-agenda.tsx`, `calendar-view-switcher.tsx`,
  `calendar-month-view.tsx`, `calendar-week-view.tsx`, `calendar-day-view.tsx`,
  `calendar-list-view.tsx`, `calendar-entry-row.tsx`, `calendar-error-state.tsx`, `index.ts`, os
  dois testes e a story.
- `src/domain/index.ts` — exportação da feature.

No front, este bloco, a seção 8 do roadmap, a seção 10 (próxima tarefa), a linha nova do histórico e
a decisão D16 na arquitetura.

**IMPLEMENTAÇÃO:**

- `CalendarAgenda` compõe o cabeçalho (anterior, próximo, Hoje e a alternância entre as visões) com
  a visão escolhida. Recebe itens, período e callbacks; não busca dado, não navega e não importa
  `@tanstack/*`, `zustand` ou `@/`.
- As quatro visões:
  - **Mês**: grade de 7 colunas começando no domingo, com os dias emprestados dos meses vizinhos
    marcados, o dia de hoje destacado, até três itens por célula e um contador `+N`.
  - **Semana**: sete colunas, cada uma com o seu dia, em rolagem horizontal abaixo de 42rem.
  - **Dia**: a lista do dia com o convite respondível (Aceitar, Talvez, Recusar), o botão desligado
    enquanto a resposta está no caminho e uma linha de estado em `role="status"`.
  - **Lista**: dias agrupados, com o selo "Hoje", o compromisso cancelado riscado e vazio explícito.
- `CalendarEntryRow` é a linha compartilhada, com o tom por tipo de compromisso, o horário no fuso da
  entrada e o `aria-label` que nomeia o link.
- Data e fuso sem dependência nova: `Intl.DateTimeFormat` com `timeZone` explícito e aritmética de
  `YYYY-MM-DD` em UTC. `todayIn` devolve o dia de hoje na zona pedida, para a tela não marcar o dia
  errado quando o cliente está em outro fuso.
- `periodWindow` por visão devolve o intervalo que o app manda para a API:
  - mês: a grade inteira, incluindo os dias emprestados (`2026-11` vai de `2026-11-01` a
    `2026-12-06`);
  - semana e lista: os sete dias do bloco;
  - dia: um dia. Todos meio abertos.

  A primeira versão devolvia o mês de calendário na visão de mês. Como a grade desenha os dias
  emprestados, o começo e o fim de cada semana apareceriam vazios. O conserto é `periodWindow`
  delegando para `monthWindow`, e o teste fixa a diferença.

- Decisão de produto registrada em D16: a entrada da agenda fica sempre na seção "explore" do menu
  principal, sem módulo.

**TESTES:** no DS, na árvore final:

- `npm run lint` — `EXIT=0`, 5 warnings que já existiam em `ui/date-text-input.tsx`,
  `domain/games/game-reviews-section.tsx`, `domain/post/reactions/post-actions.tsx`,
  `domain/post/reactions/reactions-dialog.tsx` e `domain/wellbeing/healthy-usage-dialog.tsx`. Nenhuma
  é do calendário, e nenhuma foi tocada.
- `npm run typecheck` — `EXIT=0`.
- `npm test` — 155 arquivos, **1313 testes, 0 falhas**. A feature soma 24 (13 de grade e data, 11 da
  agenda em jsdom).
- `npm run build` — `EXIT=0`.
- `npm run test:dist` — `EXIT=0` (`ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain`); a importação de
  `dist/domain/index.js` em Node puro confirma `CalendarAgenda`, `CalendarMonthView`, `monthWindow`,
  `periodWindow` e `todayIn` como funções.
- `npm run build-storybook` — `EXIT=0`.

Erros meus, retificados: os primeiros testes da grade tinham três expectativas erradas (achei que
`2026-10-01` era terça, a grade de novembro emprestava dias no começo e `monthWindow` era o mês de
calendário). O código estava certo; os testes foram corrigidos e um deles passou a cobrir os dias
emprestados.

**PR:** design system
[#164](https://github.com/Rede-ENois/enois-design-system/pull/164), aguardando revisão humana. Esta
documentação vai em PR próprio para a `qa` do front, declarando a dependência do #164.

**BLOQUEIOS:** nenhum bloqueio novo.

- Publicação da versão fica para depois do merge: não faz sentido publicar código que ninguém
  revisou, e também não dá para fixar no front a versão de uma feature que ainda não está publicada.
  O número da versão e o lock do front entram na rodada que publicar.
- B5 (sem navegador) vale para esta unidade só em parte: os componentes ainda não estão montados em
  nenhuma rota, então não há tela para medir a 390px e 1280px. As visões foram construídas com
  `min-w-0` e rolagem própria na semana; a medição fica para a rodada do front.
- B2 (`events.date`/`time` em texto) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** Fase 2, segunda unidade no DS: a entrada da agenda no menu.

- `NavigationItemData.section: "explore"`, sempre visível e sem módulo, conforme a D16.
- Um ícone de calendário no catálogo do DS, se ainda não houver um adequado.
- Teste de que a seção "explore" mostra a entrada mesmo sem módulo.
- Se a revisão do #164 mudar o contrato das visões, reconciliar antes de abrir a próxima unidade.

---

## Execução 8 — 2026-11-08 20:20 (-03:00) — Fase 2 (Design System)

**TAREFA:** abrir a segunda unidade da Fase 2 no DS. A unidade planejada pela execução 7 (entrada da
agenda no menu) já estava implementada e foi registrada como correção, não como entrega nova; a
unidade feita foi o formulário de compromisso, com o relógio de parede e o campo de horário que ele
precisa.

**REPOSITÓRIOS:**

- `Rede-ENois/enois-design-system` (código), worktree `/tmp/wt-ds-calendar`, branch
  `feat/calendar-views`, rebaseada sobre a `qa` `ed52c3c` (versão 0.29.9). O PR #164 foi mergeado em
  `0edf762` e esta branch parte dele.
- `Rede-ENois/enois-frontend` (esta documentação), worktree `/tmp/wt-calendar-docs6`, branch
  `docs/enois-calendar-execucao-8` a partir da `qa` `0dd83408`.

**ARQUIVOS:**

- `src/lib/calendar/calendar-clock.ts` e `calendar-clock.test.ts` (novos).
- `src/lib/time-input.ts` e `time-input.test.ts` (novos).
- `src/ui/time-text-input.tsx` e `time-text-input.test.tsx` (novos), mais
  `src/types/components/ui/time-text-input-props.ts` e a microcópia em `ui-messages.ts` /
  `defaults/ui.ts`.
- `src/lib/calendar/calendar-dates.ts` (correção) e `calendar-dates.test.ts` (novo).
- `src/lib/calendar/calendar-entry-draft.ts` e seu teste (novos).
- `src/domain/calendar/calendar-entry-form-dialog.tsx` e seu teste (novos), `index.ts` da feature,
  `calendar.stories.tsx`.
- `src/types/domain/calendar/`: `calendar-entry-form-values.ts`, `calendar-entry-form-props.ts`,
  `calendar-entry-form-body-props.ts`, `calendar-entry-form-draft.ts`,
  `calendar-entry-draft-problem.ts` (um tipo por arquivo).
- `src/types/messages/calendar-messages.ts`, `src/messages/defaults/calendar.ts`, `src/ui/index.ts`.

No front, este bloco, o estado e as seções 7, 8, 10 e 11 do roadmap.

**IMPLEMENTAÇÃO:**

- `instantOf(day, time, zoneId)` e `wallClockOf(instant, zoneId)` convertem entre dia + relógio e
  instante ISO em `Intl.DateTimeFormat` com fuso explícito. O deslocamento é amostrado um dia antes e
  um dia depois do horário pedido, porque o mesmo dia pode ter dois deslocamentos. Hora repetida vira
  o instante mais cedo; hora que não existe cai na próxima hora válida do fuso.
- `TimeTextInput`: campo `HH:mm` com teclado numérico, irmão do `DateTextInput`. A validade vai no
  próprio input (`setCustomValidity`), então o envio nativo também é barrado.
- Correção em `isDay`: o dia era aceito pelo parse mesmo quando não existe no calendário, porque o
  parse rolava para o mês seguinte. Agora o dia é conferido pelo valor arredondado. O teste falha no
  código anterior (`expected true to be false`).
- `CalendarEntryFormDialog`: criar e editar no mesmo diálogo, saída no formato da API. O app dona da
  mutação, da chave de idempotência e do `saveError`.
- Abertura: num dia escolhido começa às 09:00; em "hoje" começa na próxima hora cheia, e dia e
  horário saem do mesmo instante. Às 23h30 isso já é 00:00 do dia seguinte, e manter a data de hoje
  abriria um compromisso que já passou.
- Fim que cruzaria a meia-noite para na última hora do dia (23:59), porque os campos de horário não
  carregam data. Compromisso que passa da meia-noite se escreve movendo o dia.
- Regras em `calendar-entry-draft`, com os mesmos tetos da API (200 de título, 2000 de descrição,
  7 dias). Dia inválido é conferido antes do horário, para um dia inexistente não ser reportado como
  erro de formato de hora. Problemas aparecem só depois da tentativa de salvar.

**CORREÇÃO DE UMA UNIDADE PLANEJADA ERRADA:** a execução 7 registrou como próxima unidade "a entrada
da agenda no menu" com `section: "explore"` e "um ícone de calendário no catálogo do DS". As duas
coisas já existiam: `SECTION_ORDER` em `src/domain/shell/navigation-links.tsx:13` já inclui
`"explore"`, e a seção já é renderizada com o espaçamento próprio em
`src/domain/shell/navigation-links.tsx:125`. O DS não tem catálogo de ícones: o app passa os ícones
do lucide por prop. Refazer isso seria trabalho inventado, então a unidade foi trocada.

**TESTES:** no DS, na árvore final (depois do rebase na `qa` `ed52c3c`):

- `npm run lint` — `EXIT=0`, 0 erros; 6 warnings de `react-hooks/exhaustive-deps`, todos em arquivos
  fora desta unidade (`ui/date-text-input.tsx`, `ui/time-text-input.tsx`, `domain/games/`,
  `domain/post/reactions/` ×2, `domain/wellbeing/`). O warning de `ui/time-text-input.tsx` é o mesmo
  padrão que `ui/date-text-input.tsx` já tinha, de propósito: o efeito espelha o valor controlado e
  não deve rodar quando o texto digitado muda.
- `npm run typecheck` — `EXIT=0`.
- `npm test` — 161 arquivos, **1367 testes, 0 falhas**. A unidade soma 54: 10 do relógio de parede,
  4 de `isDay`, 7 da máscara de horário, 7 do `TimeTextInput`, 15 do rascunho e 11 do diálogo.
- `npm run build` — `EXIT=0`. `CalendarEntryFormDialog` sai em `dist/domain/index.d.ts`.
- `npm run test:dist` — `EXIT=0` (`ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain`).
- `npm run build-storybook` — `EXIT=0`, com quatro stories novas (criar, editar, salvando, erro ao
  salvar).

Erros meus, retificados:

- A primeira versão da abertura somava uma hora e mantinha o dia. Às 23h30 o rascunho abria 00:00 do
  dia que já tinha passado. O teste foi escrito errado na primeira tentativa (esperei 23:59 em vez de
  observar a virada) e duas expectativas seguintes tinham o fuso trocado (02:30Z é 23:30 do dia
  anterior em São Paulo). O código está certo agora; os testes foram refeitos e cobrem a virada e o
  fim que cruzaria a meia-noite.
- A primeira versão do diálogo reimplementava a máscara de data em vez de usar `DateTextInput`,
  duplicava a faixa de rolagem em vez de usar `PillRow`, usava `bg-danger-soft` (token que não
  existe) e repetia os tetos em constantes locais.

**PR:** design system
[#165](https://github.com/Rede-ENois/enois-design-system/pull/165), aguardando revisão humana. Esta
documentação vai em PR próprio para a `qa` do front, e inclui o commit `b378447f` (o número do PR da
execução 7 no log), que foi empurrado depois do merge do #748 e ficou fora dele.

**BLOQUEIOS:** nenhum bloqueio novo.

- Publicação da versão continua com a mantenedora. A seção Releases do AGENTS.md do DS diz que agente
  prepara e mantenedora corta, e que não se empilha uma branch de release em cima de outra não
  mergeada. O front continua no `0.29.9` do lock.
- B5 (sem navegador) vale para o diálogo: não medi a 390px nem a 1280px. As quatro stories existem
  para a revisão visual; o layout segue os padrões do DS (`min-w-0`, duas colunas no horário,
  `max-h-[88vh] overflow-y-auto`).
- B2 (`events.date`/`time` em texto) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** Fase 2, terceira unidade no DS: a superfície que monta a agenda com o
formulário e o estado que o app alimenta.

- Um componente que recebe os itens, o período, o rascunho aberto e os callbacks de salvar e
  responder, e compõe `CalendarAgenda` com `CalendarEntryFormDialog`. O app continua dono da
  consulta e da mutação.
- Estados explícitos de carregando, vazio e erro para o diálogo em si (hoje o erro do servidor vem
  por `saveError`, o que cobre o caso real; falta o caso de a lista recarregar depois de salvar).
- Teste de que salvar fecha o diálogo e que o erro do servidor mantém o que o leitor digitou.

---

## Execução 9 — 2026-11-08 21:20 (-03:00) — Fase 2 (Design System)

**TAREFA:** terceira unidade da Fase 2 no DS: a superfície que monta a agenda com o formulário. Um
componente que recebe os itens, o período e os callbacks, compõe `CalendarAgenda` com
`CalendarEntryFormDialog`, e fecha o ciclo de salvar: o diálogo só fecha quando o app responde que
salvou, e uma recusa do servidor mantém o que a pessoa digitou.

**REPOSITÓRIOS:**

- `Rede-ENois/enois-design-system` (código), worktree `/tmp/wt-ds-calendar`, branch nova
  `feat/calendar-agenda-surface` a partir de `feat/calendar-views` (o PR #165, ainda em revisão),
  que por sua vez parte da `qa` `ed52c3c` (versão 0.29.9).
- `Rede-ENois/enois-frontend` (esta documentação), worktree `/tmp/wt-calendar-docs9`, branch
  `docs/enois-calendar-execucao-9` a partir da `qa` `0b598b78`.

**ARQUIVOS:**

- `src/domain/calendar/calendar-agenda-surface.tsx` e `calendar-agenda-surface.test.tsx` (novos).
- `src/domain/calendar/calendar-agenda.tsx` (o cabeçalho ganha o botão de novo compromisso).
- `src/domain/calendar/index.ts` (exporta `CalendarAgendaSurface` e o tipo das props).
- `src/domain/calendar/calendar.stories.tsx` (duas stories novas do ciclo completo).
- `src/types/domain/calendar/calendar-agenda-surface-props.ts`,
  `calendar-agenda-surface-draft.ts`, e `calendar-agenda-props.ts` (dois props novos).
- `src/types/messages/calendar-messages.ts`, `src/messages/defaults/calendar.ts` (`newEntry`).

No front, este bloco, o estado e as seções 6, 7, 8, 10 e 11 do roadmap, e a decisão D18 na
arquitetura.

**IMPLEMENTAÇÃO:**

- `CalendarAgendaSurface` é composição controlada, o mesmo padrão de `ProjectsManager` no DS: o app
  é dono da consulta, do período, da visualização, da chave de idempotência e da mutação; a
  superfície é dona de uma coisa só, qual entrada está no formulário.
- `onSave(values, entry)` devolve `Promise<boolean>`. `entry` é `null` ao criar e a entrada ao
  editar; `true` fecha o diálogo, `false` mantém aberto com os campos e mostra o `saveError` que o
  app passar. Nada de fechar por otimismo.
- A entrada que o app manda editar ganha do rascunho local: abrir pelo detalhe tem de mostrar aquela
  entrada, não o que ficou pela metade aqui. Ao abrir um compromisso novo, a superfície devolve
  `onEditingChange(null)` para o app limpar a seleção, senão a entrada voltaria a abrir no próximo
  render.
- Compromisso novo nasce no dia que a pessoa está vendo: o dia escolhido na grade do mês quando
  existe (`selectedDay`), senão o período na tela (`dayOfPeriod`). É o que evita salvar num dia fora
  da vista.
- `CalendarAgenda` ganhou `newEntryLabel` e `onNewEntry`, os dois opcionais: sem eles o cabeçalho
  desenha exatamente o que desenhava antes, então o PR não muda nada de quem já usa a agenda.
- O botão fica ao lado da alternância de visão, no `flex shrink-0`, para não competir com o título do
  período no celular.

**CORREÇÃO DE UM ITEM PLANEJADO:** a próxima execução da rodada 8 pedia "estados explícitos de
carregando, vazio e erro para o diálogo em si". Os três já existem: `calendar-day-view.tsx:34`,
`:38` e `:54` desenham `LoadingState`, `CalendarErrorState` e `EmptyState`, e a superfície repassa
`loading`, `error` e `onRetry` para a agenda via `...agenda`. Inventar um quarto estado seria
trabalho duplicado. O que falta de verdade é o app recarregar a janela depois de salvar, e isso é da
Fase 3, quando existe tela.

**TESTES:** no DS, na árvore final (`feat/calendar-agenda-surface` sobre `feat/calendar-views`
`585e911`):

- `npm run lint` — `EXIT=0`, 0 erros; os mesmos 6 warnings de `react-hooks/exhaustive-deps` em
  arquivos fora desta unidade (`ui/date-text-input.tsx`, `ui/time-text-input.tsx`, `domain/games/`,
  `domain/post/reactions/` ×2, `domain/wellbeing/`).
- `npm run typecheck` — `EXIT=0`.
- `npx vitest run` — 162 arquivos, **1373 testes, 0 falhas**. A unidade soma 6 testes, todos em
  `calendar-agenda-surface.test.tsx`.
- `npm run build` — `EXIT=0`.
- `npm run test:dist` — `EXIT=0` (`ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain`).
- `npm run build-storybook` — `EXIT=0`, com as stories `AgendaWithForm` e `AgendaEditRefused`.

Os seis testes cobrem: abrir do cabeçalho com o diálogo fechado e fechar só depois do salvamento
aprovado; recusa do servidor mantendo campo digitado e mensagem de erro; dia inicial vindo do dia
escolhido na grade; agenda inicial vinda do app e troca pelo leitor dentro do formulário; edição
abrindo preenchida com a entrada e reportando a mesma entrada ao salvar; e o app limpando a entrada em
edição ao abrir uma nova.

Erro meu, retificado: o primeiro teste de edição usava um `onEditingChange` de mentira que não
guardava o valor, e o teste media um diálogo que continuava aberto porque ninguém tinha limpado a
entrada no app. O teste passou a manter o estado do lado do app, que é como o componente é usado de
verdade; a asserção final é sobre o estado do app, não sobre um espião.

**PR:** design system
[#166](https://github.com/Rede-ENois/enois-design-system/pull/166), aguardando revisão humana.
Dependência declarada no corpo: a branch parte do PR #165 e o merge tem de vir depois dele. Esta
documentação vai no PR [#751](https://github.com/Rede-ENois/enois-frontend/pull/751), para a `qa` do
front.

**BLOQUEIOS:** nenhum bloqueio novo.

- Publicação da versão continua com a mantenedora (seção Releases do AGENTS.md do DS: agente prepara,
  mantenedora corta, e não se empilha branch de release em cima de outra não mergeada). O front segue
  no `0.29.9` do lock.
- B5 (sem navegador) vale para esta unidade: não medi a 390px nem a 1280px. As duas stories novas
  existem para a revisão visual; o layout reaproveita os padrões já usados na agenda (o botão entra no
  `flex shrink-0` do cabeçalho, o diálogo já tem `max-h-[88vh] overflow-y-auto`).
- B2 (`events.date`/`time` em texto) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** Fase 2 está com o que a Fase 3 precisa do DS (visões, alternância, formulário e
a superfície que os junta). A próxima unidade é a **Fase 3, primeira tela: a agenda no front**.

- Rota `/agenda` no front (`src/routes/agenda.tsx`) com `beforeLoad` protegido, entrada no menu na
  seção `explore` e o módulo em `/me/preferences`.
- Consulta da janela por `periodWindow(view, period)` contra `GET /calendar/entries`, com
  `loading`/`error`/`onRetry` ligados nos props que a agenda já aceita.
- Estado do período, da visualização e da entrada em edição na URL (`search` da rota), para o
  recarregar e o voltar do navegador não perderem o contexto.
- Mutação de criar/editar com chave de idempotência (D11), devolvendo `Promise<boolean>` para a
  superfície, e recarga da janela depois do `true`.
- Se o DS ainda não tiver versão publicada com #165/#166, usar o `vX.Y.Z-rc.N` que a mantenedora
  cortar da branch em revisão, nunca empilhar release.

---

## Execução 10 — 2026-11-08 22:00 (-03:00) — Fase 3 (telas das agendas)

**TAREFA:** abrir a Fase 3 no front. A unidade planejada era a tela `/agenda`, mas ela depende do
pacote do DS publicado com o módulo de calendário, e a publicação está com a mantenedora. A unidade
entregue é a camada que a tela consome e que não depende da publicação: os tipos do contrato e o
cliente `calendarApi` no front.

**REPOSITÓRIOS:**

- `Rede-ENois/enois-frontend` (código e documentação). Worktree novo `/tmp/wt-calendar-front`,
  branch `feat/enois-calendar-api` a partir da `qa` `1d0e9694`. A árvore principal do workspace está
  numa branch de outra sessão com trabalho não commitado, por isso o worktree separado.
- Nenhuma mudança de backend e nenhuma do DS nesta rodada.

**ARQUIVOS:**

- `src/lib/api/calendar.ts` e `src/lib/api/calendar.test.ts` (novos).
- `src/lib/api/index.ts` exporta `calendarApi`.
- `src/types/application/calendar/` (novos, um tipo por arquivo): `calendar-scope.ts`,
  `calendar-entry-kind.ts`, `calendar-entry-state.ts`, `calendar-participation.ts`,
  `calendar-entry-view.ts`, `calendar-agenda-item-view.ts`, `calendar-agenda-detail-view.ts`,
  `calendar-participant-view.ts`, `calendar-window-query.ts`, `create-calendar-entry-input.ts`,
  `update-calendar-entry-input.ts`.

**IMPLEMENTAÇÃO:**

- Os tipos foram escritos a partir do contrato real do backend (`CalendarEntryController` na `qa`):
  `AgendaItemView`, `AgendaDetailView`, `CalendarEntryView`, `ParticipantView`, os dois corpos de
  escrita e a rota de convites pendentes. Os enums são uniões de string com o mesmo vocabulário do
  servidor, não tipo inventado.
- `calendarApi.list` exige `from`/`to` e omite `scope` em branco. A janela do servidor é obrigatória
  e meio aberta, então pedir sem intervalo é 400: o tipo obriga a mandar.
- `calendarApi.respond` aceita só `ACCEPTED`, `DECLINED` e `TENTATIVE`. `INVITED` é o estado de quem
  ainda não respondeu e o servidor recusa como resposta; o tipo impede antes de sair pela rede.
- As escritas usam `api.post`/`patch`/`delete`, que já mandam `Idempotency-Key` (o backend exige em
  toda escrita da agenda). Não inventei um caminho novo de escrita.
- O cancelamento devolve a entrada com `state: "CANCELLED"`, e o tipo diz isso: a tela não deve
  tratar a resposta como lista vazia nem sumir com a linha.

**TESTES:** no front, na árvore final do worktree `/tmp/wt-calendar-front`:

- `npm run typecheck` — `EXIT=0`.
- `npm run lint` — sem erro.
- `npx vitest run src/lib/api/calendar.test.ts` — 9 testes verdes.
- `npx vitest run` (suíte inteira) — **1196 testes, 0 falhas**.
- `npm run build` — `EXIT=0`.

Os nove testes travam: a query da janela como o servidor a espera (datas URL-encoded), a omissão de
`scope` vazio, o envio de `scope` quando a tela está em uma agenda só, a rota sem query quando não há
data (em vez de `undefined` na URL), o POST de criação, o PATCH só com os campos que mudaram, o
cancelamento devolvendo a entrada marcada, a trava de tipo que impede responder `INVITED`, e a
leitura dos convites pendentes em rota própria.

**PR:** enois-frontend
[#752](https://github.com/Rede-ENois/enois-frontend/pull/752), aguardando revisão humana. O corpo
declara que a tela `/agenda` ainda não entrou e por quê, e que este PR não depende de nenhum PR
aberto.

**BLOQUEIOS:** um bloqueio externo novo, com encaminhamento.

- **B6 — o pacote do DS publicado não tem o módulo de calendário.** O `@rede-enois/design-system`
  instalado é `0.29.9` e `node_modules/@rede-enois/design-system/dist/domain/` não tem `calendar/`
  nem exporta `CalendarAgenda`. Os PRs #164 (mergeado em código), #165 e #166 estão no repositório do
  DS, mas a versão publicada não os inclui: a publicação é da mantenedora (seção Releases do
  AGENTS.md do DS) e a branch de release não pode ser empilhada em cima de outra não mergeada.
  Enquanto isso, a rota `/agenda` não pode importar `CalendarAgenda` sem o front apontar para uma
  versão ainda não publicada. Encaminhamento: pedir à mantenedora o corte de um `v0.30.0-rc.1` a
  partir de `feat/calendar-views` depois do merge de #165/#166, e então o front sobe a dependência
  e a tela entra. Nada disso é decisão de agente.
- B5 (sem navegador) continua, mas não se aplica: esta rodada não desenha tela.
- B2 (`events.date`/`time` em texto) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** duas frentes, na ordem de valor e sem depender de decisão de terceiro.

1. **Se B6 estiver resolvido** (versão do DS publicada com o calendário), a tela `/agenda` como
   planejado: rota protegida, entrada no menu em `explore`, janela por `periodWindow` contra
   `calendarApi.list`, período e visualização na URL, mutação devolvendo `Promise<boolean>` e recarga
   da janela.
2. **Sem B6**, avançar na Fase 1 do backend com o que não depende da tela: lembrete de compromisso
   pelo worker de outbox e o `sourceRef` de mentoria (reagendamento atualizando a mesma entrada em
   vez de criar outra), cada um com teste de contrato.

**CORREÇÃO REGISTRADA:** a seção 10 do roadmap, atualizada na execução 9, supunha que a tela poderia
consumir o DS pelo pacote. A leitura do pacote instalado nesta rodada mostra que não: falta a versão
publicada. O roadmap foi corrigido na mesma entrega.

---

## EXECUÇÃO 11

**DATA/HORA:** 2026-11-09T00:30:00-03:00

**FASE:** 1 (fundação do calendário) — contrato entre módulo de origem e agenda central

**TAREFA:** fechar o vínculo entre a sessão de mentoria e a agenda central pela origem: upsert
idempotente por (`owner`, `source_type`, `source_id`), índice único que a D3 prometia e a V257 não
entregou, e o MentorService escrevendo e cancelando a entrada.

**REPOSITÓRIOS:** `Rede-ENois/enois-backend` (worktree `/tmp/wt-cal-backend`, branch
`feat/enois-calendar-mentoring-source` sobre a `qa` `da71ae95`)

**ARQUIVOS:**

- `src/main/resources/db/migration/V260__calendar_entries_source_unique.sql` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/application/CalendarSourceService.java` (novo)
- `src/main/java/com/socialcoisa/rede/calendar/adapters/out/persistence/CalendarEntryJpaEntity.java`
  (índice único declarado na entidade)
- `src/main/java/com/socialcoisa/rede/mentoring/application/MentorService.java` (fiação)
- `src/test/java/com/socialcoisa/rede/calendar/CalendarSourceServiceTests.java` (novo, 7 testes)
- `src/test/java/com/socialcoisa/rede/mentoring/adapters/in/web/MentoringCalendarSyncTests.java`
  (novo, 2 testes)

**IMPLEMENTAÇÃO:**

- `CalendarSourceService` é o único caminho de escrita para uma entrada que tem origem. `upsert`
  procura por (`ownerId`, `sourceType`, `sourceId`): se existe e está ativa, reagenda, renomeia e
  reescreve a descrição na mesma linha; se existe e está cancelada, não mexe (entrada cancelada não
  volta por um upsert do sistema de origem). Se não existe, cria com `scope`/`kind` do origem.
  `cancel` acha pela origem e devolve a entrada cancelada, ou vazio quando a origem não existe,
  sem virar erro.
- V260 troca `idx_calendar_entries_source` por `uq_calendar_entries_source` em (`owner_id`,
  `source_type`, `source_id`). O índice é por dono porque dois donos podem ter entrada para a mesma
  origem, e isso está coberto por teste.
- `MentorService.scheduleSession` chama `syncCalendar` depois de gravar a sessão: entrada em
  `PROFESSIONAL`/`MENTORING`, título com as especialidades do mentor, descrição com a mensagem da
  sessão, fuso `AGENDA_ZONE` que o serviço de mentoria já usa. `cancelSession` chama
  `calendar.cancel` com a origem da sessão. A entrada é do mentorado, porque é ele quem participa da
  reunião marcada.
- Sem `timeZoneId` explícito o serviço cai no fuso padrão do módulo (`America/Sao_Paulo`), o mesmo
  que a agenda usa na escrita web, em vez de usar o fuso do servidor.

**TESTES:** no worktree do backend, `./mvnw -o test -Dtest=...`:

| Classe                             | Testes | Resultado                                                                                                  |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `CalendarSourceServiceTests`       | 7      | verde (repetição mantém uma linha, reagendar move, violação de unicidade, dono separado, cancelado não volta, origem desconhecida, título/descrição) |
| `MentoringCalendarSyncTests`       | 2      | verde (sessão marcada aparece na agenda do mentorado e não na do mentor; cancelamento cancela a entrada e a linha fica) |
| `CalendarEntryPersistenceTests`    | 5      | verde                                                                                                      |
| `Calendar*Tests`, `Mentor*Tests`, `Mentoring*Tests` (regressão) | 83 | **0 falhas**, BUILD SUCCESS (9m08s)                                                                        |

O teste de unicidade falha antes do conserto: com o índice comum que a V257 criou, a segunda linha
com a mesma origem entrava e o `upsert` duplicava. A prova agora é a violação 23505 do H2 na
tentativa de gravar a segunda linha direto pelo repositório.

**PR:** enois-backend
[#568](https://github.com/Rede-ENois/enois-backend/pull/568), aguardando revisão humana. Não depende
de nenhum PR aberto.

**BLOQUEIOS:** nenhum novo. Continuam:

- **B6** (DS publicado sem o módulo de calendário) segue de pé e ainda é o que impede a tela
  `/agenda`. O caminho adotado nesta rodada foi avançar pela camada que não depende dela.
- B2 (`events.date`/`time` em texto) continua pendente como unidade própria.

**PRÓXIMA EXECUÇÃO:** a tela `/agenda` da Fase 3, resolvendo B6 sem depender da mantenedora cortar
release, na ordem: (1) conferir se `@rede-enois/design-system@0.29.10-rc.1` no registro já aponta
para código com o calendário (a tag `v0.29.10-rc.1` existe mas aponta para `7c0d17e`, anterior aos
PRs de calendário); (2) se ainda não tiver, publicar um `v0.30.0-rc.1` a partir da branch de
calendário do DS por quem tem permissão, e enquanto isso montar a rota `/agenda` no front com o
cliente `calendarApi` que já está na `qa`, usando os componentes do DS instalados a partir de um
link local declarado no PR, para a tela existir e ser revisada; (3) lembrete de compromisso pelo
worker de outbox como unidade seguinte.

---

## EXECUÇÃO 12

**DATA/HORA:** 2026-11-09T19:10:00-03:00

**FASE:** 3 (telas das agendas), com a preparação da Fase 2 que a bloqueava

**CONTEXTO:** esta execução **retoma o trabalho após a sessão anterior ter morrido**. O primeiro
ato não foi implementar: foi confrontar o roadmap com o estado real dos quatro repositórios.

**TAREFA:** destravar o bloqueio B6 e entregar a rota `/agenda`.

**REPOSITÓRIOS:** `Rede-ENois/enois-backend` (consulta), `Rede-ENois/enois-design-system`
(release), `Rede-ENois/enois-frontend` (tela)

**O QUE O INVENTÁRIO MUDOU EM RELAÇÃO AO QUE O ROADMAP DIZIA:**

| O roadmap dizia | O estado real |
|---|---|
| #542 (detalhe e convites pendentes) aberto, aguardando revisão | **mergeado** em 2026-11-08 |
| #165 e #166 (formulário e superfície do DS) abertos | **mergeados** em 2026-11-09 |
| #752 (tipos e `calendarApi`) aberto | **mergeado** |
| #568 (origem da mentoria) aberto | **mergeado** em 2026-11-09 — e foi ele que trouxe a segunda V260 que quebrou a `qa` |
| "a tela depende da publicação do DS" | confirmado, e mais grave: **nenhuma** versão publicada tem o módulo. A tag `v0.29.10-rc.1` aponta para `7c0d17e`, 24 commits antes do calendário (`git ls-tree 7c0d17e \| grep -c calendar` → 0) |

**IMPLEMENTAÇÃO:**

1. **Release do DS (destrava B6).** Bump de `0.29.9` para `0.30.0` a partir do `main`, que já tem o
   módulo — o mesmo diff de 3 linhas dos releases anteriores. Issue [#171](https://github.com/Rede-ENois/enois-design-system/issues/171),
   PR [#172](https://github.com/Rede-ENois/enois-design-system/pull/172). **Não empurrei a tag:** o
   CONTRIBUTING do DS diz, textualmente, que publicar é ação de mantenedora ("agents prepare, they
   do not publish... Never push tags, edit the publish workflow or publish by hand").
2. **Rota `/agenda`** (front [#769](https://github.com/Rede-ENois/enois-frontend/pull/769), em
   draft): protegida por sessão; visão, período e agenda na URL; `periodWindow` decide os dias da
   visão e `instantOf` converte para instante no fuso do navegador — o mesmo em que o calendário lê
   os cliques; criar usa `calendarApi.create` e o formulário só fecha quando o servidor aceitou;
   responder convite recarrega a janela; entrada no menu na seção `explore` sem módulo (D16).

**ARQUIVOS:**

- `src/routes/agenda.tsx` (novo), `src/routes/agenda.test.tsx` (novo)
- `src/lib/query-options/calendar.ts` (novo)
- `src/components/navigation-items.ts`, `src/lib/require-auth.ts`, `src/texts.ts`,
  `src/routeTree.gen.ts` (21 linhas adicionadas), `package.json`

**TESTES:** front, no worktree `feat/enois-calendar-agenda` sobre a `qa` `ebb0a81c`, com o
`@rede-enois/design-system@0.30.0` **empacotado localmente** (`npm pack` da `main`, o caminho que o
CONTRIBUTING do DS indica):

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | EXIT=0 |
| `npx eslint` nos arquivos tocados | EXIT=0, 0 erros |
| `npx vitest run src/routes/agenda.test.tsx` | **3/3 verde** |
| `npx vitest run` (suíte inteira) | **1220/1223**; as 3 falhas são `src/lib/e2e/key-manager.test.ts` (crypto/IndexedDB lentos sob carga). Verificado que **passam** isolados neste worktree, na pasta `src/lib/e2e/` inteira, e numa árvore limpa da `qa` — flaky pré-existente, sem relação com a mudança |
| `npx vite build` | EXIT=0; `agenda-*.mjs` (SSR) e `agenda-*.js` (cliente) no bundle |

O teste novo falha no código anterior: com a regex antiga `/^\d{4}-\d{2}(-\d{2})?$/`,
`?period=2026-13` passava e virava janela inválida (400 da API). A validação agora confere o mês e o
dia de verdade.

Design System, na `main` `c1d44c1` (base do release):

| Comando | Resultado |
|---|---|
| `npm run lint` | EXIT=0, 0 erros, 6 warnings `exhaustive-deps` pré-existentes |
| `npx tsc --noEmit` | EXIT=0 |
| `npm test` | **163 arquivos, 1558 testes, 0 falhas** |
| `npm run build` / `npm run test:dist` | EXIT=0 / `ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain` |

**PR:** DS [#172](https://github.com/Rede-ENois/enois-design-system/pull/172) (issue #171) e front
[#769](https://github.com/Rede-ENois/enois-frontend/pull/769).

**BLOQUEIOS:** **B6** continua aberto até a mantenedora publicar `v0.30.0` — o #769 está em draft e
o CI dele vai falhar antes disso. **B7** (novo): sem token `read:packages` nesta máquina, o
`package-lock.json` do #769 não pôde ser regerado aqui e precisa de um `npm install` depois do
release.

**PRÓXIMA EXECUÇÃO:** ver roadmap §10 — destravar o #769 assim que a tag sair, e então a rota de
detalhe (`/agenda/$entryId`) sobre o `GET /calendar/entries/{id}` que já existe.

---

## EXECUÇÃO 13

**DATA/HORA:** 2026-11-09T21:40:00-03:00

**FASE:** 1/6 — contrato de lembrete (a fase 6 depende dele)

**INVENTÁRIO ANTES DE IMPLEMENTAR:** a `qa` do front avançou para `4edcdd13` (o docs #770 foi
mergeado — pelo bot, sem revisão humana). O PR do release do DS (#172) foi **mergeado** por
`melmonfre` e o `main` do DS está em `0.30.0`, **mas a tag `v0.30.0` não existe**
(`git ls-remote --tags` → nenhuma `v0.30`). Sem tag não há pacote: o front #769 continua em draft,
com o CI falhando em `ETARGET`. B6, portanto, **não** fechou.

**TAREFA:** em vez de reescrever o diagnóstico do B6 (terceira vez), pegar a unidade independente
que o roadmap lista na fase 1/6: **lembretes de compromisso**, decisão D4.

**REPOSITÓRIO:** `Rede-ENois/enois-backend` (worktree `feat/enois-calendar-reminders`, sobre a `qa`
`25c648ad`)

**ARQUIVOS:**

- `src/main/resources/db/migration/V264__calendar_reminders.sql` (novo)
- `calendar/domain/CalendarReminder.java` (novo)
- `calendar/application/CalendarReminderService.java` (novo)
- `calendar/application/CalendarReminderWorker.java` (novo)
- `calendar/application/port/out/CalendarReminderRepository.java` (novo)
- `calendar/adapters/out/persistence/{CalendarReminderJpaEntity,CalendarReminderPersistenceAdapter,SpringDataCalendarReminderJpaRepository}.java` (novos)
- `calendar/application/CalendarCommandService.java` (cancelar/reagendar encerram os pendentes)
- `calendar/adapters/in/web/CalendarEntryController.java` (rotas `/{entryId}/reminders`)
- `CalendarReminderServiceTests` (10) e `CalendarRemindersApiTests` (5) — novos

**IMPLEMENTAÇÃO:**

- Tabela com `due_at`, `attempts`, `sent_at`, `last_error` e **índice único** em (entrada, pessoa,
  antecedência) — a duplicata é recusada pelo banco, não pela aplicação.
- Worker `@Scheduled(fixedDelayString = "${rede.calendar.reminder-delay-ms:30000}")`, mesmo desenho
  do `ScheduledPostPublishWorker`: o lote por ciclo é 20, a falha é contada na linha e o laço
  continua.
- **Participação checada no envio**, não na criação: convidado que aceita depois do lembrete criado
  passa a ser avisado, e convite não respondido encerra o lembrete sem notificar.
- Cancelar e reagendar chamam `clearPendingForEntry`: aviso do horário antigo não sai.
- Antecedências: 5, 15, 30, 60, 1440 — no domínio **e** na `check constraint` da migration.

**DECISÕES DE IMPLEMENTAÇÃO QUE VIRARAM CÓDIGO:**

1. `notifications.actor_id` é `not null` e não há precedente de notificação sem ator no repositório.
   Um lembrete não tem pessoa por trás, então o autor é o literal `system`
   (`CalendarReminderService.SYSTEM_ACTOR`), documentado no ponto de uso.
2. As rotas ficaram **dentro** do `CalendarEntryController`, e não num controller novo com
   `@RequestMapping("/calendar/entries/{entryId}/reminders")`: o primeiro teste deu 404 em todas as
   rotas do dono porque o mapeamento de classe não compunha com o `/{entryId}` do controller pai.
   O padrão do repositório (`participants`) declara as rotas aninhadas no pai.
3. `ofReader` lista só os **pendentes**. O primeiro teste falhou porque a lista devolvia o lembrete
   já encerrado — a tela escolhe lembrete, não histórico.

**TESTES:** `./mvnw -o test` no worktree:

| Classe | Testes | Resultado |
|---|---|---|
| `CalendarReminderServiceTests` | 10 | verde |
| `CalendarRemindersApiTests` | 5 | verde |
| `CalendarSourceServiceTests` | 7 | verde |
| `CalendarEntryTests` / `CalendarEntryPersistenceTests` | 8 + 5 | verde |
| `CalendarEntryReadApiTests` / `CalendarEntryWriteApiTests` | 9 + 9 | verde |
| `CalendarInvitationApiTests` / `CalendarDetailAndPendingInvitationsApiTests` | 11 + 6 | verde |
| `MentoringCalendarSyncTests` | 2 | verde |
| `FlywayMigrationConfigTests` / `MariaDbReservedWordsTests` | 5 + 2 | verde (migração V264 aceita) |
| `AutomatedWritePathsTests` | 2 | verde (a rota nova de escrita exige 401 sem sessão) |

**81 testes, 0 falhas.**

Quatro falhas reais foram encontradas e corrigidas durante a unidade (não eram flakes): query derivada
`findByEntryIdAndUserIdAndMinutesBefore` não compila no Spring Data ("MinutesBefore" vira
`minutes`+`Before`) — resolvida com `@Query`; `actor_id` nulo derrubava o insert; o teste de API
usava o apelido da conta em vez do id real do banco como dono da entrada; e a **guarda
`NotificationCategoryTests`** — que varre os pontos de `NotificationService.create` e recusa qualquer
`kind` sem categoria de push — pegou o `CALENDAR_REMINDER` no CI da suíte completa (os 81 testes da
unidade não a incluíam). Mapeado como `SYSTEM`. **Lição: roda de notificação nova tem que entrar no
`NotificationCategory`, e a suíte completa é quem cobra isso.**

**PR:** enois-backend [#604](https://github.com/Rede-ENois/enois-backend/pull/604), aguardando
revisão humana. Guarda `🧪 Migrações sem versão duplicada` já verde no PR.

**BLOQUEIOS:** B6 continua — **mergear não publica**. O #172 está mergeado e o `main` em `0.30.0`;
falta a tag, que é ação da mantenedora (D20). B7 também continua (sem `read:packages` local).

**PRÓXIMA EXECUÇÃO:** roadmap §10 — a tag quando sair, e então o detalhe do compromisso; o seletor
de lembrete no DS é o par do #604 na tela.

---

## EXECUÇÃO 13 — desdobramento (destravar B6)

**DATA/HORA:** 2026-11-10T01:45:00-03:00

**TAREFA:** a tag do design system, mandada pela Mel, não publicou nada. Descobrir por quê e fechar
o bloqueio que parou a tela `/agenda`.

**CAUSA RAIZ:** a release/tag foi criada como **`0.30.0`**, sem o prefixo `v`. O workflow do DS
dispara em `refs/tags/v*` (`if: startsWith(github.ref, 'refs/tags/v')`), então **nenhum run foi
criado** — o repositório tinha a tag e o pacote não existia. Todas as releases anteriores
(`v0.27.5`, `v0.27.4`…) usam o `v`; esta foi a primeira sem.

**CORREÇÃO:**

1. Tag `v0.30.0` criada no **mesmo commit** da `0.30.0` (`7d40855`, o `main`). Publish
   `enois-design-system#42735841594` → **verde** (`Lint, typecheck, test and build` e
   `Publish to GitHub Packages`).
2. Lockfile do front: o `package.json` já pedia `0.30.0`, mas o `package-lock.json` continuava em
   `0.29.10-rc.1` (por isso `npm ci` falhava com `ETARGET`). Sem `read:packages` local, o lock foi
   regerado **pelo registro** dentro do CI (`npm install --package-lock-only --ignore-scripts` com
   o `GITHUB_TOKEN`, que tem `packages: read`), num workflow descartável que commitou o arquivo e
   foi removido da árvore em seguida — `resolved`/`integrity` vieram do npm, não de valor escrito à
   mão (regra da D20).
3. `#769` saiu do draft. CI **verde** (`verificar`, `Validar build`, CodeQL, Analyze); o build
   gerou os chunks `agenda-*`, provando que a rota entra no bundle servido.

**ARQUIVOS:** `package-lock.json` (front, commit `4bae42fc`); tag `v0.30.0` no design system.

**LIÇÃO PARA A D20:** *mergear* e *publicar* são coisas diferentes, e agora também **o nome da tag
importa**. Uma tag criada pela interface do GitHub como release pode sair sem o `v`, e aí o
workflow não escuta. Antes de anunciar "publicado", conferir que existe um run disparado pela tag.


---

## Execução 14 — 2026-11-09 ~23:30 (fase 3: telas das agendas)

**TAREFA:** roadmap §10 item 2 — rota de detalhe do compromisso (`/agenda/$entryId`) sobre o
`GET /calendar/entries/{id}` (#542, já na `qa` do backend).

**DESCOBERTA DE ESTADO (antes de confiar no roadmap):** backend PR #604 (lembrete pelo worker, D4)
foi **mergeado** em 2026-11-10T01:16Z e está na `qa` — a unidade "lembrete" do §10 item 3 já não é
tarefa de implementação no backend. O pacote `@rede-enois/design-system@0.30.0` publicado
**não contém** o `CalendarEntryDetail` (conferido no tarball do registro): o componente vive só no
DS PR #177, ainda aberto. O #769 da tela `/agenda` continua aberto, já destravado (lockfile aponta
o 0.30.0 real).

**REPOSITÓRIOS/ARQUIVOS:**

- Design System — branch `feat/calendar-entry-detail`, PR
  [#177](https://github.com/Rede-ENois/enois-design-system/pull/177) (issue #176, aberto antes,
  faz parte desta unidade): `src/domain/calendar/calendar-entry-detail.tsx` (componente
  `CalendarEntryDetail`), `calendar-entry-detail.test.tsx` (12 testes),
  `src/types/domain/calendar/calendar-entry-detail-{data,participant,props}.ts`,
  microcópia `detail` em `calendar-messages.ts` + defaults, stories
  `DetailOrganizer`/`DetailGuest`/`DetailCancelled`. 53 testes no módulo de calendário; suíte
  inteira 1569/1570 (a 1 falha é `appearance-dialog.test.tsx`, flake provado isolado, sem relação).
- Frontend — branch `feat/enois-calendar-detail`, PR
  [#777](https://github.com/Rede-ENois/enois-frontend/pull/777) (**draft**), baseado na branch do
  #769 (dependência declarada no PR): `src/routes/agenda.$entryId.tsx` (rota com guarda de sessão,
  query do detalhe, mutações de editar/cancelar/responder/convidar/remover invalidando
  `['agenda']`), `agenda.$entryId.test.tsx` (5 testes), `agenda.tsx` ganhou `itemHref`,
  `texts.ts` (+4 textos de erro), `routeTree.gen.ts` regenerado pelo plugin do build.

**IMPLEMENTAÇÃO:** o detalhe mostra título, tipo, escopo, hora de parede no fuso da entrada
(`wallClockOf`, D17), descrição e banner de cancelado; organizador vê participantes + convite pelo
@, convidado vê os botões de resposta, espectador não vê nada (o backend já devolve
`participants: null` para quem não é organizador). Editar reusa o `CalendarEntryFormDialog` do DS.
**Nota sobre o `routeTree.gen.ts`:** o arquivo commitado já estava desatualizado na base — regenerar
reordena os imports do arquivo inteiro (688↔689 linhas); provado regenerando a base limpa.

**TESTES (front, worktree sobre `ebb0a81c` + branch do #769):**

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | EXIT=0 |
| `npx eslint` nos arquivos tocados | EXIT=0 |
| `npx vitest run agenda.$entryId.test.tsx agenda.test.tsx` | **8/8 verde** |
| `npx vite build` | EXIT=0, chunks de `/agenda` e `/agenda/$entryId` no bundle |

**BLOQUEIOS:** B6 reaberto para o detalhe — o CI do #777 fica vermelho até o DS #177 ser mergeado
e uma versão nova publicada; encaminhamento é o mesmo do release anterior (`npm install
@rede-enois/design-system@<nova>` no lockfile). **B8 (novo):** o bot `kof-agent-worker` tem
mergeado PRs na `qa` sem aprovação humana (ex.: #604), contrariando a regra absoluta do projeto;
reportado à mantenedora — nenhuma proteção foi alterada por mim.

**PRÓXIMA EXECUÇÃO:** roadmap §10 atualizado — (1) revisão humana do DS #177 e release novo para
destravar o #777; (2) lembretes no front consumindo `PUT/DELETE /calendar/entries/{id}/reminders`
(backend já na `qa` via #604) — o DS ainda não tem seletor de lembrete; (3) disponibilidade e
conflitos (fase 6).

---

## EXECUÇÃO 15 — 2026-11-09 ~23:45 (fase 3: telas das agendas)

> **Entrada reconstruída na execução 17.** A execução 15 nunca teve seção própria neste arquivo —
> a unificação das execuções 13–16 no commit `78eae7d8` pulou do 14 para o 16. O resumo abaixo vem
> da linha 15 do histórico do roadmap (§11), que foi escrita na época e não foi alterada.

**TAREFA:** rota de detalhe do compromisso no front.

**IMPLEMENTAÇÃO:** `/agenda/$entryId` com o detalhe do compromisso e o lugar de quem lê (editar,
cancelar, responder ao convite, convidar e remover participante), sobre o `CalendarEntryDetail` do
DS #177.

**TESTES:** 5 testes da rota de detalhe (8 com os da `/agenda`); `tsc`, `eslint` e `vite build`
verdes.

**PRs:** front [#777](https://github.com/Rede-ENois/enois-frontend/pull/777) — aberto em draft,
porque o DS #177 ainda não estava publicado (B6).

**NOTAS:** o estado real dos PRs foi reconferido e §7/§9 corrigidos; **B8 registrado** (o bot
`kof-agent-worker` mergeando PRs na `qa` sem aprovação humana).

---

## EXECUÇÃO 16 — 2026-11-10T01:45:00-03:00 — Fase 3 (telas das agendas)

**TAREFA:** publicar o Design System com o `CalendarEntryDetail` (pedido explícito da mantenedora:
"mergeei tudo do DS, ajusta aí, gera uma tag e bora") e destravar o front #777.

**REPOSITÓRIOS:** `Rede-ENois/enois-design-system` (branch `chore/release-0.30.1` sobre `main`
`3776208`), `Rede-ENois/enois-frontend` (branch `feat/enois-calendar-detail`).

**IMPLEMENTAÇÃO:**

1. **DS**: `#177` mergeado (2026-11-10T03:26Z). Release `0.30.1` com o bump de 3 linhas
   (`package.json` + `package-lock.json`), PR [#180](https://github.com/Rede-ENois/enois-design-system/pull/180),
   e a tag `v0.30.1` empurrada para `main`. O workflow publicou `@rede-enois/design-system@0.30.1`
   (log do job `Publish`: `+ @rede-enois/design-system@0.30.1`).
2. **Front**: pin para `0.30.1`; lockfile regerado por workflow descartável com `GITHUB_TOKEN`
   (B7) e removido depois. O branch de detalhe foi **mesclado com a `qa`**, o que apagou 214 erros
   de lint que apareciam no CI — eles vinham do `src/routes/feed.tsx` **desatualizado no branch**,
   não do detalhe (a correção dos filtros do feed já está na `qa`, commit `5aeca8ab`).

**TESTES:**

| Onde | Comando | Resultado |
|---|---|---|
| DS | `npm run lint` / `npx tsc --noEmit` | EXIT=0 / EXIT=0 |
| DS | `npm test` | **1570/1570** |
| DS | `npm run build` / `npm run test:dist` | EXIT=0 / `ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain` |
| DS | `npm pack` | contém `dist/domain/calendar/calendar-entry-detail.js` |
| Front | `npm run lint` | **0 erros**, 10 warnings pré-existentes |
| Front | `npx tsc --noEmit` | EXIT=0 |
| Front | `npx vitest run agenda.$entryId.test.tsx agenda.test.tsx` | **8/8** |
| Front | `npx vite build` | EXIT=0 |
| Front | CI do #777 (`verificar`, `Validar build`) | **pass** (3m03s / 54s) |

**PRs:** DS [#180](https://github.com/Rede-ENois/enois-design-system/pull/180) (release) e front
[#777](https://github.com/Rede-ENois/enois-frontend/pull/777) — este saiu do draft e está **100%
verde** aguardando revisão humana.

**BLOQUEIOS:** B6 e B7 **fechados**. Nenhum merge de PR foi feito por mim; a tag foi empurrada a
pedido explícito da mantenedora (D20 registra que publicar é ação humana).

**PRÓXIMA EXECUÇÃO:** ver §10 — seletor de lembrete no DS + tela, e início da fase 6.

---

## EXECUÇÃO 17 (bloco) — 2026-11-10T03:00–04:10-03:00 — Fases 3 e 6 (5 unidades verificáveis)

**TAREFA:** primeira rodada em blocos (pedido da mantenedora: "cada rodada deve entregar 2 a 4
unidades verificáveis, não uma só"). Unidades: (A) incorporar o conteúdo único do docs PR #774 no
PR #778; (B) seletor de lembrete no DS; (C) cliente de API dos lembretes no front; (D) fase 6 no
backend: inventário + detecção de conflito; (E) cliente de API do conflito no front.

**REPOSITÓRIOS:** `enois-design-system` (`feat/calendar-reminder-selector` sobre `main` pós-#180),
`enois-frontend` (`feat/enois-calendar-reminders` sobre `qa` `9d89d063`),
`enois-backend` (`feat/enois-calendar-conflict` sobre `qa` `4f22a6d7`).

**IMPLEMENTAÇÃO:**

1. **(A) Docs**: o conteúdo único do #774 (causa raiz da tag sem `v` e o processo do lockfile
   regerado pelo registro) foi trazido para o branch do #778 — mas o **bot mergeou o #778 antes**,
   pegando só o commit antigo: o conteúdo da unidade A chegou à `qa` por este PR de docs aqui
   (bloco 17), não pelo #778. O #774 segue aberto para fechar em revisão. Corrigimos também um
   resíduo de patch (`+++ b/...` literal) que tinha entrado no log.
2. **(B) DS**: `CalendarReminderSelector` — radiogroup acessível (`aria-label`, `aria-busy`), seis
   opções (`CalendarReminderMinutes` = união literal `{5,15,30,60,1440}` do backend), opção "não
   avisar", estado `saving` que desabilita tudo e `error` como `role="alert"`. Microcópia própria no
   `calendar.ts` de mensagens. Story com harness de estado e estados de saving/erro.
3. **(C) Front**: `CalendarReminderView` + `listReminders`/`setReminder`/`clearReminder` em
   `calendarApi` (PUT/DELETE com `minutesBefore` na query, como o `@RequestParam` do backend lê).
4. **(D) Backend (fase 6)**: inventário antes de codar — o que existe: `MentorAvailability`
   (regra semanal dia+HH:mm, São Paulo), `MentorSlot` (instante único, book/release), geração de 28
   dias em `MentorService.saveAvailability`, upsert da mentoria na agenda central
   (`CalendarSourceService`, D12/D19), `CalendarEntry.overlaps` meio-aberto e leitura por janela.
   O que **não** existe: detecção de conflito no nível da agenda. Entregue:
   `CalendarConflictService` reutilizando `CalendarQueryService.agenda` (D13: conflito é a mesma
   agenda que a tela mostra — dono + ACCEPTED/TENTATIVE; pendente e recusado não ocupam horário;
   cancelado não conflita; `entryId` exclui a própria entrada na edição). **Leitura, não bloqueio**:
   sobrepor de propósito continua possível, a escrita não virou 409 (D23). Rota
   `GET /calendar/entries/conflicts?from&to[&scope][&entryId]`. **Sem migração Flyway** — zero
   schema novo; a semântica meio-aberta já vem da consulta existente.
5. **(E) Front**: `CalendarConflictQuery` + `calendarApi.conflicts({from,to,scope?,entryId?})` para
   a rota do item 4.

**TESTES:**

| Onde | Suíte | Resultado |
|---|---|---|
| DS (B) | testes novos do seletor | **8/8** |
| DS (B) | módulo calendar | **61/61** |
| DS (B) | suíte inteira | **1578/1578** |
| DS (B) | lint / tsc / build / test:dist | EXIT=0 nos quatro |
| Front (C+E) | `calendar.test.ts` | **14/14** (3 de lembrete + 2 de conflito) |
| Front (E, após o cherry-pick no #792) | `calendar.test.ts` / `tsc --noEmit` | **14/14** / EXIT=0 |
| Front (C+E) | `tsc --noEmit` / `eslint src` | EXIT=0 / 0 erros, 9 warnings pré-existentes |
| Backend (D) | `CalendarConflictServiceTests` | **9/9** |
| Backend (D) | `CalendarConflictApiTests` | **4/4** |
| Backend (D) | regressão do módulo calendar (9 suítes) | **78 verdes** |

**PRs:** DS [#187](https://github.com/Rede-ENois/enois-design-system/pull/187), front
[#786](https://github.com/Rede-ENois/enois-frontend/pull/786), backend
[#607](https://github.com/Rede-ENois/enois-backend/pull/607), docs (este).

**FALHA REAL DA RODADA (perda de unidade por merge automático):** o bot mergeou o #786 às
05:47Z, **antes** do push da unidade E (cliente de conflito). O merge carregou só o commit
`6d731488` (lembretes); `calendarApi.conflicts` não está na `qa`. Conferido com
`git show enois/qa:src/lib/api/calendar.ts`. Correção: cherry-pick do commit `9bc6c0fe` sobre a
`qa` atual, testes e tsc de novo (**14/14**, EXIT=0), PR de seguimento
[#792](https://github.com/Rede-ENois/enois-frontend/pull/792). É o custo concreto do B8: o merge
automático publicou um PR declarado "aguardando revisão" **no meio da rodada**, e a unidade que
chegou depois ficou de fora.

**BLOQUEIOS/NOTAS:**

- **B8 agravado**: durante a própria rodada, o bot `kof-agent-worker` mergeou #778, #786 e #607 —
  no #786 com `REVIEW_REQUIRED` ainda marcado e a única aprovação sendo a do próprio bot. Os PRs
  foram escritos para revisão humana; nenhum merge foi feito por mim. Segue decisão da mantenedora.
- Ferramenta local: um `V260__calendar_entries_source_unique.sql` **antigo** em `target/classes`
  (da execução 11) sombreava o V260 real da `qa` e derrubava o contexto Flyway dos testes — limpar
  o `target` resolveu. Armadilha de `/tmp` registrada para as próximas sessões.
- Decisão **D23** registrada na arquitetura (conflito é leitura da mesma agenda, não um segundo
  motor).

**PRÓXIMA RODADA (§10, proposta de execução 18):** disponibilidade semanal no nível da agenda
(migração nova), aviso de conflito no formulário do DS, e — se o #187 mergear — release do DS e
seletor de lembrete na tela de detalhe.

---

## EXECUÇÃO 18 (bloco) — 2026-11-10T05:00–09:30-03:00 — Fase 6 (3 unidades verificáveis)

**TAREFA.** Fase 6 (disponibilidade e conflitos), o que faltava depois do #607: a janela semanal
persistida da agenda, o aviso de conflito na superfície do formulário e o cliente do front para a
disponibilidade. A tela de lembrete continua bloqueada no DS #187 (aberto, sem release novo).

**ESTADO REAL CONFERIDO ANTES.** O roadmap dizia #792/#791 abertos; `gh pr view` mostrou os dois
**mergeados** — de novo pelo bot `kof-agent-worker` (#792 em `7e160805` às 07:06Z, #791 em
`52c1a5d4` às 07:12Z). O
conteúdo está na `qa`: `calendarApi.conflicts` e o tipo `CalendarConflictQuery` conferidos com
`git show enois/qa:`. O DS #187 segue aberto com `REVIEW_REQUIRED` e CI verde.

### Unidades

1. **(A) Backend — disponibilidade semanal da agenda.** `CalendarAvailabilityWindow` (record:
   pessoa, dia ISO 1–7, `LocalTime` início/fim, fuso, criação; `overlaps` meio-aberto),
   `CalendarAvailabilityService` (semana substituída de uma vez, no máximo 50 janelas, cruzamento
   no mesmo dia recusado com 400 `INVALID_AVAILABILITY` e **nada gravado**, semana isolada por
   pessoa), porta + adaptador JPA + rotas `GET`/`PUT /calendar/availability`, e a migração
   **V267**. Sem janela atravessando a meia-noite: 22h–2h são duas janelas, porque um horário só
   perderia o dia do fim.
2. **(B) DS — aviso de conflito no formulário.** `CalendarEntryFormProps` ganhou
   `conflicts?: CalendarAgendaItemData[]`; o `FormBody` recorta a lista contra o intervalo **que
   está nos campos** (não contra a janela buscada) com a mesma semântica da D23, e mostra uma linha
   `role="status"`. Ignora cancelado e a própria entrada em edição; dia inteiro cobre o dia; rascunho
   sem intervalo válido não avisa. **Não bloqueia o salvar** — é a decisão da D23 preservada na
   superfície. Microcópia nova em `calendar.form.conflictWarning(count)` (singular e plural).
3. **(C) Front — cliente de API da disponibilidade.** `CalendarAvailabilityWindowView`,
   `CreateCalendarAvailabilityWindowInput` (arquivo próprio por causa do
   `local/type-boundaries`), `calendarApi.availability()` e `calendarApi.setAvailability(windows)`.

### Arquivos

- Backend: `calendar/domain/CalendarAvailabilityWindow.java`,
  `calendar/application/CalendarAvailabilityService.java`,
  `calendar/application/port/out/CalendarAvailabilityRepository.java`,
  `calendar/adapters/out/persistence/CalendarAvailability{JpaEntity,PersistenceAdapter}.java`,
  `calendar/adapters/out/persistence/SpringDataCalendarAvailabilityJpaRepository.java`,
  `calendar/adapters/in/web/CalendarAvailabilityController.java`,
  `src/main/resources/db/migration/V267__calendar_availability.sql`,
  `src/test/java/.../CalendarAvailabilityServiceTests.java`,
  `src/test/java/.../adapters/in/web/CalendarAvailabilityApiTests.java`.
- DS: `src/domain/calendar/calendar-entry-form-dialog.tsx`,
  `src/types/domain/calendar/calendar-entry-form-props.ts`,
  `src/types/messages/calendar-messages.ts`, `src/messages/defaults/calendar.ts`,
  `src/domain/calendar/calendar-entry-form-dialog.test.tsx`.
- Front: `src/types/application/calendar/calendar-availability-window-view.ts`,
  `src/types/application/calendar/create-calendar-availability-window-input.ts`,
  `src/lib/api/calendar.ts`, `src/lib/api/calendar.test.ts`.

### Testes (executados)

| Onde | Suíte | Resultado |
|---|---|---|
| Backend (A) | `CalendarAvailabilityServiceTests` | **9/9** |
| Backend (A) | `CalendarAvailabilityApiTests` | **7/7** |
| Backend (A) | regressão do módulo calendar (11 suítes) | **99/99** |
| DS (B) | `calendar-entry-form-dialog.test.tsx` | **18/18** (7 novos) |
| DS (B) | `src/domain/calendar` + `src/lib/calendar` | **89/89** |
| DS (B) | suíte inteira | **1577/1577** |
| DS (B) | lint / tsc / build | 0 erros (6 warnings pré-existentes) / EXIT=0 / EXIT=0 |
| Front (C) | `src/lib/api/calendar.test.ts` | **17/17** (3 novos) |
| Front (C) | `src/lib/api` | **125/125** |
| Front (C) | `tsc --noEmit` / `eslint` nos arquivos / `vite build` | EXIT=0 / 0 erros / EXIT=0 |

### PRs

DS [#195](https://github.com/Rede-ENois/enois-design-system/pull/195) (aviso de conflito; CI
"Lint, typecheck, test and build" verde), backend
[#613](https://github.com/Rede-ENois/enois-backend/pull/613) (disponibilidade), front
[#801](https://github.com/Rede-ENois/enois-frontend/pull/801) (cliente), docs (este).

### Bloqueios / notas

- **Colisão de migração, de novo.** A V265 que eu tinha escrito virou **V267**: na mesma janela, a
  `qa` recebeu `V265__user_presence_last_seen_index` e `V266__badge_kits` de outras frentes. O CI
  do #613 reprovou em "Migrações sem versão duplicada" — o check funcionou. Rebasing na `qa` e
  renumerando, os três checks (migração, schema, testes) voltaram. **Lição:** conferir
  `git ls-tree enois/qa` **imediatamente antes** de escolher o número, não no começo da rodada.
- **Bug de teste meu, não do produto.** O helper do teste de API envolvia a lista já entre
  colchetes, produzindo `{"windows":[[...]]}` e um 400 genérico. O produto estava certo; corrigi o
  helper. Vale a nota porque o sintoma (400 `BAD_REQUEST`) não apontava para o teste.
- **B8 continua:** #792 e #791 foram mergeados pelo bot durante a rodada anterior, sem revisão
  humana. Nenhum merge foi feito por mim.
- **Bloqueado por revisão:** #187 (seletor de lembrete no DS), #195 (aviso de conflito no DS),
  #613 (disponibilidade), #801 (cliente). As telas dependem do #613 e do release do DS.

**FECHAMENTO DA RODADA — o que o bot mergeou.** Pouco depois da abertura, o bot
`kof-agent-worker` mergeou **#613** (`0bd98c2c`), **#801** (`b089837b`) e **#802**
(`09a75b9b`), de novo sem revisão humana (B8). Conferido com `git ls-tree`/`git show` que o
conteúdo chegou íntegro: a `qa` tem `V267__calendar_availability.sql` (a V265 da `qa` é a de
`user_presence` e a V266 é a de `badge_kits` — nenhuma sobrescrita), os oito arquivos de
disponibilidade no backend, os dois tipos e os dois métodos do cliente no front, a D24 na
arquitetura e a execução 18 no log. O único PR do bloco ainda aberto é o **DS #195**; ele precisa de
revisão humana para o aviso de conflito existir no pacote.

**PRÓXIMA RODADA (§10, proposta de execução 19):** a tela de disponibilidade no front (a partir do
cliente do #801) e a superfície de disponibilidade no DS; ligar `conflicts` no `CalendarEntryFormDialog`
da tela `/agenda` quando o #195 for publicado; e, se o #187 mergear, o release do DS com o seletor de
lembrete.

## EXECUÇÃO 19 (bloco) — 2026-11-10T11:00–14:30-03:00 — Fase 6 (3 unidades verificáveis)

**TAREFA.** Bloco da execução 19 do roadmap: (1) superfície de disponibilidade no DS;
(2) tela de disponibilidade no front; (3) ligar `conflicts` na `/agenda`; (4) release do DS se
#187/#195 mergearem.

**ESTADO REAL CONFERIDO ANTES.** O roadmap dizia "#187 e #195 abertos"; `gh pr view` mostrou os dois
**mergeados** em `d1d128f0` (#187) e `3604673a` (#195) — de novo pelo bot `kof-agent-worker` (B8) —
e um **PR de release aberto pelo bot**: [#196](https://github.com/Rede-ENois/enois-design-system/pull/196)
(`chore/release-0.31.0`, CI verde, publish SKIPADO como esperado antes da tag). O item 4 do bloco já
estava em andamento fora de mim; **não foi aberto PR duplicado**. Nenhuma tag `v0.31.0` existe ainda.

### Unidades

1. **(A) DS — superfície de disponibilidade semanal.** Tipos
   (`CalendarAvailabilityDraft`, `CalendarAvailabilityWindowInput/Data`, problemas
   `day|clock|endBeforeStart|overlaps|tooMany`), regras puras em
   `src/lib/calendar/calendar-availability-draft.ts` (`MAX_WINDOWS=50`, relógio `hh:mm`, fim
   estritamente depois do começo, meio-aberto: janelas que se encostam **não** sobrepõem, teto de
   50), editor `CalendarAvailability` (linha por janela, dia em pílulas 1=segunda…7=domingo,
   `TimeTextInput`, lixeira, validação só na tentativa de salvar) e
   `CalendarAvailabilitySurface` controlada (D18: props entram, callbacks saem; semana nova do app
   substitui o rascunho). Microcópia nova `calendar.availability`.
2. **(B) DS — `conflicts` na `CalendarAgendaSurface`.** O aviso do #195 (#195 mergeado) tinha a
   props só no `CalendarEntryFormDialog`; a superfície da agenda não repassava, então a `/agenda`
   não tinha caminho. `CalendarAgendaSurfaceProps.conflicts?: CalendarAgendaItemData[] | null`
   com repasse direto ao diálogo. Commit `1a7ec87` empilhado no PR da unidade A.
3. **(C) Front — tela de disponibilidade + aviso ligado na `/agenda`.** Rota
   `/agenda/disponibilidade` (arquivo `agenda_.disponibilidade.tsx` — o `_` quebra o aninhamento:
   `/agenda` não tem `Outlet`), `requireAuth`, `calendarApi.availability()`/`setAvailability()`
   (cliente do #801, já na `qa`), `setQueryData` com a resposta do servidor. Na `/agenda`,
   `calendarQueries.conflicts({from,to})` — a mesma janela que a agenda desenha, **sem escopo na
   chave** (o aviso vale para as duas agendas) — repassada a
   `CalendarAgendaSurface.conflicts`; falha da consulta é silenciosa (sem lista, sem aviso, sem
   bloqueio — D23).

### Arquivos

- DS: `src/domain/calendar/calendar-availability.tsx` e `calendar-availability-surface.tsx` (+2 testes),
  `src/lib/calendar/calendar-availability-draft.ts` (+teste), 5 tipos novos em
  `src/types/domain/calendar/`, `calendar-agenda-surface.tsx` e `calendar-agenda-surface-props.ts` com `conflicts`,
  `src/types/messages/calendar-messages.ts` + `src/messages/defaults/calendar.ts`.
  Branch `feat/calendar-availability-surface` sobre `main` `fabb777`, commits `5800e56` + `1a7ec87`.
- Front: `src/routes/agenda_.disponibilidade{.tsx,.test.tsx}`, `src/routes/agenda.tsx`,
  `src/lib/query-options/calendar.ts` (+ `calendar.test.ts` novo), `src/texts.ts`,
  `src/routeTree.gen.ts` (regenerado pelo build). Branch
  `feat/enois-calendar-availability-screen` sobre `qa` `1ed7284d`, commits `8a3770bf` + `5c979ba0`.

**TESTES:**

| Onde | Suíte | Resultado |
|---|---|---|
| DS (A) | `calendar-availability-surface.test.tsx` | **12/12** |
| DS (A) | `calendar-availability-draft.test.ts` | **14/14** |
| DS (B) | `calendar-agenda-surface.test.tsx` | **8/8** (2 novos: repasse de `conflicts` com `role="status"` e sem aviso quando nada toca o intervalo) |
| DS (A+B) | suíte inteira (commit `1a7ec87`) | **1655/1655** |
| DS | lint / tsc / build | 0 erros / EXIT=0 / EXIT=0 |
| Front (C) | `agenda_.disponibilidade` + `agenda` + `query-options/calendar` | **7/7** |
| Front | suíte inteira | 1249/1254 — 5 falhas de **timeout PBKDF2 (5s) em `lib/e2e`** que passam **isoladas** (20/20); flake de carga, nenhum teste de agenda falhou; [prova comentada no PR](https://github.com/Rede-ENois/enois-frontend/pull/804#issuecomment-6773706799) |
| Front | `tsc --noEmit` | só 2 erros **pré-existentes** de `badgeKits` (DS `main` pós-#195 exige a prop; front na `qa` ainda não) — comprovados com `git stash` na base limpa |
| Front | `eslint` nos arquivos tocados / `vite build` | 0 erros / EXIT=0 (`routeTree.gen.ts` com `/agenda/disponibilidade`) |

**PRs:** DS [#197](https://github.com/Rede-ENois/enois-design-system/pull/197) (A+B, aberto,
`REVIEW_REQUIRED`), front [#804](https://github.com/Rede-ENois/enois-frontend/pull/804) (C, em
**draft** até o release do DS com as duas peças), docs (este).

**ARMADILHAS DA RODADA:**

- **Cache do Nitro**: o build do front falhou com "`CalendarAvailabilitySurface` is not exported"
  vindo de `node_modules/.nitro/vite/services/ssr/assets/agenda_*.js` — bundle **antigo** do
  tarball anterior. `rm -rf node_modules/.nitro` e o build passou. Nova armadilha de B6: trocou o
  tarball, limpe o cache do Nitro.
- **`push --force-with-lease` com refspec longa**: `--force-with-lease=<branch>:<sha> <branch>` só
  funciona se a ref remota está no `refs/remotes` local; com worktree novo, resolver com
  `git ls-remote` + o SHA esperado exato.
- **`gh pr edit --body`** falha com erro GraphQL de Projects (classic); PATCH JSON em
  `gh api repos/.../pulls/N -X PATCH --input -` funciona.

**BLOQUEIOS/NOTAS:**

- **B8**: #187 e #195 mergeados pelo bot durante/entre as rodadas; o bot também abriu o PR de
  release #196 (0.31.0, com seletor de lembrete + aviso de conflito). A superfície da unidade A e
  o `conflicts` da unidade B **não estão** no escopo do 0.31.0; o #804 fica em draft até um
  release posterior. Publicação é ação humana (D20): tag `v*`.
- O pacote publicado (0.30.2-rc.3) não tem nenhuma peça nova; o branch do front valida contra o
  tarball do #197 via `npm pack` (B6/B4).
- **B6 nota**: `tsc --noEmit` do front na base limpa tem 2 erros de `badgeKits` — a `qa` do front
  exige um release do DS que inclua o `main` atual; registrado para não culpar o diff errado.

**PRÓXIMA RODADA (§10, proposta de execução 20):** (1) revisão/tag do release #196 (humano,
D20) e release seguinte com o #197 quando revisarem; (2) ligar o seletor de lembrete na rota de
detalhe `/agenda/$entryId` (#777 em revisão; o componente está no #187, já mergeado no `main` do
DS); (3) destravar o #804 do draft quando o pacote sair (regerar lockfile pelo workflow
descartável, B7); (4) iniciar a fase 4 (agenda social: eventos de grupo na agenda) ou a fase 8
(ICS export), que não dependem do release.

---

## EXECUÇÃO 20 (bloco) — 2026-11-10T15:00–17:30-03:00 — Fase 8 (iCalendar, 3 unidades)

**TAREFA.** Bloco proposto no §10: (1) destravar o que o release mergeou; (2) ligar o seletor de
lembrete no detalhe; (3) avançar fase 8 (ICS export) no backend. O item 1 se resolveu sozinho
conferido antes de começar (abaixo); o seletor segue dependendo da revisão do #777, então o bloco
foi a fase 8 inteira de ponta a ponta: export + import no backend e a tela no front.

**ESTADO REAL CONFERIDO ANTES.** O roadmap da `qa` dizia "#804 em draft" e "nenhuma tag v0.31.0";
`gh pr view`/`gh pr list` mostraram **#804 MERGEADO** e **#808 (docs 19) MERGEADO**, o release
**0.31.0 publicado** (tag `v0.31.0` no merge do #196, run 42869575669, `latest`) e o DS **#201**
(ajuste de relógio no teste do conflito) também mergeado. Fase 6 está completa na `qa` — corrigido
no roadmap na mesma rodada. Sem PR duplicado a abrir: ninguém tinha começado ICS
(`git grep -il "VCALENDAR"` só achava comentários).

### Unidades

1. **(A) Backend — export `.ics`.** `CalendarIcsService.export` + `GET /calendar/entries/export.ics`
   (`CalendarIcsController`, `text/calendar` com `Content-Disposition: attachment`). `UID` estável
   (origem `TIPO-ID` quando existe; `enois-<entryId>` quando não), `SEQUENCE` derivado de
   `updatedAt−createdAt`, `STATUS:CANCELLED` publicando o cancelamento com o mesmo `UID`,
   `DTSTAMP` em UTC e `DTSTART/DTEND` com `TZID` do fuso de cada compromisso. `VTIMEZONE` por fuso
   usado, **derivado das transições reais** do `ZoneRules` (um `STANDARD` fixo erraria metade do
   ano; teto de 400 observâncias/10 anos, fixa quando o fuso não tem transição). Folding em 75
   octets contando UTF-8 sem partir codepoint. Janela obrigatória, meio-aberta, teto de 1 ano.
   Convidado entra no arquivo junto com o que organiza (a mesma união da leitura da agenda).
2. **(B) Backend — import `.ics`.** `CalendarIcsService.importCalendar` +
   `POST /calendar/entries/import` **multipart** (padrão do `/me/import/resume`), com
   `Idempotency-Key` obrigatória (D11: escrita). Cada `VEVENT` vira entrada com origem `ICS`+`UID`
   via `CalendarSourceService` — repetir o arquivo não duplica (D3) e o reagendamento do arquivo
   move a entrada que já existe. Parser próprio (sem dependência nova, no espírito de D8):
   unfolding de continuação, escape/unescape de `,;\n\`, `TZID` explícito, UTC (`Z`) e
   `VALUE=DATE` (dia inteiro — `UpsertInput` ganhou `allDay`, com construtor de 10 args
   preservado). `TZID` desconhecido cai no fuso padrão em vez de recusar o arquivo; `VEVENT` sem
   `UID`/sem horário ou acima do `MAX_DURATION` é contado em `skipped`. Teto de 512 KB e 500
   eventos: import não é dump.
3. **(C) Front — botão de download na `/agenda`.** `calendarApi.exportUrl({from,to,scope})`
   (endereço pronto; a resposta é arquivo, não JSON), `src/lib/calendar-export.ts` com fetch
   **com sessão** (cookie + headers de origem) e download por `blob:`/âncora — 401 ali é toast de
   erro, não deslogamento. Botão `Button` do DS (0.31.0 real) em `PageHeader.actions`, com a
   janela e o escopo **que a tela está mostrando**: ver o mês e receber o ano confundiria. Textos
   novos em `texts.agenda`. Markup cru: zero.

### Arquivos

- Backend: `calendar/application/CalendarIcsService.java` (novo), `calendar/adapters/in/web/CalendarIcsController.java`
  (novo), `calendar/application/CalendarSourceService.java` (`allDay` no `UpsertInput`),
  testes `CalendarIcsServiceTests.java` (11) e `adapters/in/web/CalendarIcsApiTests.java` (7).
- Front: `src/lib/api/calendar.ts` (`exportUrl`), `src/lib/api/calendar.test.ts` (+2, e mock ganhou
  `apiUrl`), `src/lib/calendar-export.ts` (novo), `src/routes/agenda.tsx` (botão + estado),
  `src/texts.ts` (4 chaves).

### Testes (rodados de verdade nesta árvore)

| Onde | Suíte | Resultado |
|---|---|---|
| Backend (A+B) | `CalendarIcsServiceTests` | **11/11** |
| Backend (A+B) | `CalendarIcsApiTests` | **7/7** |
| Backend | regressão `-Dtest='Calendar*'` (todas as suítes do módulo, incluindo os 18 novos) | **117/117 verdes**, EXIT=0 |
| Front (C) | `calendar.test.ts` | **18/18** |
| Front (C) | `agenda.test.tsx` | **3/3** |
| Front (C) | `tsc --noEmit` / `eslint` / `vite build` | EXIT=0 / 0 erros / EXIT=0 |

### Armadilhas e notas

- O `node_modules` do worktree novo saiu do clone da mantenedora com o **DS 0.30.x** — `tsc`
  apontava `badgeKits`/`PullIndicator` ausentes (pré-existente, não do bloco). Construí o 0.31.0
  do `main` do DS num clone limpo (`npm ci && npm run build`) e substituí o `dist` no worktree;
  `tsc` foi a EXIT=0 com o pacote real.
- `MockMultipartHttpServletRequestBuilder` não é subclasse de `MockHttpServletRequestBuilder`
  (é de `Abstract...`): o helper de teste teve de receber o tipo multipart direto.
- Primeira tentativa de escrever o serviço saiu corrompida no Write (arquivo com linhas duplicadas
  de import); detectado no mesmo passo e reescrito inteiro antes de compilar.

### PRs

- Backend [#629](https://github.com/Rede-ENois/enois-backend/pull/629) — export + import (fase 8).
- Front [#809](https://github.com/Rede-ENois/enois-frontend/pull/809) — botão "Baixar .ics"
  (declara dependência do #629).
- Docs (este PR).

**PRÓXIMA RODADA (§10, proposta de execução 21):** import na tela (upload do `.ics` com aviso de
conflito antes de aplicar), seletor de lembrete quando o #777 for revisado, e fase 9 (assinatura
privada, D7) ou fase 4 (fonte de eventos de grupo).


---

## EXECUÇÃO 21 (bloco) — 2026-11-10T18:00–20:30-03:00 — Fase 4 iniciada e seletor de lembrete (3 unidades)

### Unidades

1. **(A) Backend — presença em evento de grupo vira compromisso na agenda.** `Event` ganhou
   `startsAt()`: lê a data/hora de texto livre no fuso da rede (`America/Sao_Paulo`), com
   meia-noite quando não há hora legível — o evento sem horário ocupa o dia, não "não existe".
   `EventService` passou a chamar `CalendarSourceService` com origem `EVENT`+`eventId` (D27):
   `attend` grava a entrada do participante, `cancelAttendance` a remove, `update` move a de
   todos os participantes, `delete` e `sanitizeExpired` removem de todos. O evento não guarda
   hora de fim, então a entrada ocupa **uma hora** a partir do começo (`DEFAULT_EVENT_DURATION`):
   duração zero viola a constraint `ends_at > starts_at`, e "dia inteiro" mentiria sobre um
   encontro com hora marcada. A porta ganhou `deleteBySource` (apagar ≠ cancelar: o fato deixou
   de existir, não há cancelamento a publicar no `.ics`).
2. **(B) Backend — a porta de origem encerra lembrete pendente.** `CalendarSourceService.upsert`
   (quando a entrada se move) e `cancel` agora chamam `CalendarReminderService.clearPendingForEntry`,
   igual ao caminho direto (`CalendarCommandService`). Era um buraco real: um compromisso vindo de
   mentoria, import ou evento reagendado mantinha o aviso do horário antigo agendado.
3. **(C) Front — seletor de lembrete ligado em `/agenda/$entryId`.** O #777 mergeou nesta rodada,
   então a unidade que esperava revisão humana destravou. O `CalendarEntryDetail` do DS ganhou um
   slot opcional `reminder` (o app não pode escrever markup — `local/no-front-markup`), e a rota
   busca `listReminders`, mostra a escolha única e, ao trocar, apaga as outras antecedências antes
   de gravar a nova: o servidor guarda um lembrete por antecedência, e duas ligadas avisariam duas
   vezes por uma escolha só. "Não avisar" apaga todas. A regra ficou numa função pura
   (`reminderChanges`) para o teste prendê-la sem montar a tela.

### Arquivos

- Backend: `events/domain/Event.java` (`startsAt`), `events/application/EventService.java`
  (sincronização com a agenda), `calendar/application/CalendarSourceService.java` (limpeza de
  lembrete + `delete`), `calendar/application/port/out/CalendarEntryRepository.java`
  (`deleteBySource`), `calendar/adapters/out/persistence/CalendarEntryPersistenceAdapter.java` e
  `SpringDataCalendarEntryJpaRepository.java` (implementação).
- Testes backend: `events/adapters/in/web/EventCalendarSyncTests.java` (novo, 5),
  `calendar/CalendarReminderServiceTests.java` (+2), `events/application/EventSanitizationWindowTests.java`
  e `shared/application/IntelligentCacheTests.java` (construtor novo do `EventService`).
- DS: `domain/calendar/calendar-entry-detail.tsx` (slot `reminder`),
  `types/domain/calendar/calendar-entry-detail-props.ts` (`reminder?: ReactNode`),
  `calendar-entry-detail.test.tsx` (+3).
- Front: `src/routes/agenda.$entryId.tsx` (query dos lembretes, mutação, `reminderChanges`, slot),
  `src/routes/agenda.$entryId.test.tsx` (+4), `src/texts.ts` (`errorReminder`).

### Testes (rodados de verdade nesta árvore)

| Onde | Suíte | Resultado |
|---|---|---|
| Backend (A) | `EventCalendarSyncTests` | **5/5** |
| Backend (B) | `CalendarReminderServiceTests` | **12/12** |
| Backend (B) | `CalendarSourceServiceTests` | **7/7** |
| Backend (A+B) | regressão completa `./mvnw -o test` | **ver abaixo** |
| DS (C) | `calendar-entry-detail.test.tsx` | **15/15** |
| DS (C) | suíte inteira `npx vitest run` | **1659/1659** (175 arquivos) |
| DS (C) | `npx tsc --noEmit` / `npm run lint` / `npm run build` | EXIT=0 / 0 erros / EXIT=0 |
| Front (C) | `agenda.$entryId.test.tsx` | **9/9** |
| Front (C) | `tsc --noEmit` / `eslint` | EXIT=0 / 0 erros (2 avisos pré-existentes de fast-refresh) |

### Armadilhas e notas

- **Duração zero:** o primeiro teste de presença deu 409 em 4 casos. O evento só tem começo, então
  `expiresAt()` devolvia o mesmo instante e a constraint `ends_at > starts_at` recusava. Resolvido
  com a duração padrão de uma hora, explícita no serviço.
- **`host` e `time` são `not null` no banco** (V5): o PATCH de teste sem `host` deu
  `NULL not allowed for column "HOST"`, e criar evento sem `time` deu o mesmo em `TIME`. O teste
  de "evento sem hora" virou "evento ocupa uma hora porque não tem hora de fim", com hora marcada.
- **Construtor do `EventService` mudou:** dois testes que o instanciavam à mão precisaram do mock
  novo do `CalendarSourceService`.
- **Regressão completa:** o primeiro `./mvnw -o test` morreu antes de rodar qualquer teste (log
  parado no cabeçalho do Surefire, sem processo Java). Relançado com `setsid nohup`; a suíte
  inteira leva ~15 min porque cada teste de integração sobe o contexto e roda as migrações.
- **O log de execuções na `qa` estava corrompido:** um merge posterior sobrescreveu o arquivo com
  a versão da execução 13 e deixou um marcador `>>>>>>> origin/qa` no fim, perdendo as execuções
  14–20. Restaurado a partir do commit do bloco 20 (`59cf5e44`) neste PR.
- **O DS instalado no worktree do front era o 0.30.1**, sem o slot novo. Construí o pacote a partir
  do branch do DS (`npm run build && npm pack`) e troquei o `node_modules/@rede-enois/design-system`
  pelo tarball; `tsc` só passou a enxergar `reminder` depois disso.
- **A suíte inteira do front tem 4 falhas em 2 arquivos** que não são deste bloco; as suítes
  tocadas (`agenda*`, `texts`) passam 18/18.

### PRs

- Backend (A+B) — PR aberto para `qa`, aguardando revisão humana.
- DS (C) — PR aberto para `main`, aguardando revisão humana (o slot precisa de release antes de o
  front consumir a versão publicada).
- Front (C) — PR aberto para `qa`, aguardando revisão humana; declara a dependência do slot no DS.
- Docs (este PR) — parte da `qa` atual e leva o estado para 21, restaurando o log.

**PRÓXIMA RODADA (§10, proposta de execução 22):** import na tela com o contrato do #629 já
estável; fase 4 adiante (próxima fonte social com data/hora legível); fase 9 (assinatura privada,
D7) sobre o serviço `.ics` que está na `qa`.
