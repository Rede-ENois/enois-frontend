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
