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
