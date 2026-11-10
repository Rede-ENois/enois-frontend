# Énóis Calendar — Roadmap de execução

> **Fonte persistente de contexto entre execuções horárias do cronjob.**
> Este arquivo é lido no início de cada execução e atualizado no fim. Não sobrescrever o histórico:
> acrescentar. O log detalhado de cada execução vive em
> [`ENOIS-CALENDAR-EXECUTION-LOG.md`](ENOIS-CALENDAR-EXECUTION-LOG.md); as decisões arquiteturais
> em [`ENOIS-CALENDAR-ARCHITECTURE.md`](ENOIS-CALENDAR-ARCHITECTURE.md).

---

## Estado

```
PROJECT_STATUS=IN_PROGRESS
CRONJOB_STATUS=ACTIVE
FASE_ATUAL=3 (telas das agendas) — detalhe do compromisso completo: DS #177 mergeado, release 0.30.1 publicado (tag v0.30.1) e o front #777 com CI verde, fora do draft. Fase 3 só depende de revisão humana dos PRs abertos
EXECUCAO=16
ULTIMA_ATUALIZACAO=2026-11-10T01:45:00-03:00
```

---

## 1. Objetivo

Construir um sistema de agendas dentro do Énóis, com duas agendas independentes (social e
profissional), uma visualização consolidada, motor central de compromissos, disponibilidade,
convites, lembretes, integração com Épapo e Tamo Junto, e interoperabilidade iCalendar (exportação,
importação, assinatura privada) — servindo de infraestrutura temporal para todos os módulos
existentes e futuros.

O produto é "qualquer pessoa organiza a vida social e profissional no Énóis", não "uma tela de
calendário".

---

## 2. Repositórios envolvidos

| Repositório                      | Papel                                     | Branch de entrega          | Estado verificado em 2026-11-08                                        |
| -------------------------------- | ----------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `Rede-ENois/enois-backend`       | API, motor de eventos, migrações, workers | `qa` → `main`              | Base real em `6ac79d83`; último migration `V257__calendar_entries.sql` |
| `Rede-ENois/enois-frontend`      | Telas, navegação, tipos, cliente de API   | `qa` → `main`              | Base em `6765a46a`                                                     |
| `Rede-ENois/enois-design-system` | Componentes e tokens compartilhados       | publica pacote versionado  | Consumido como `@rede-enois/design-system@0.29.9`                      |
| `Rede-ENois/epapo`               | Sala de reunião (fork do Jitsi)           | `master` (push = produção) | Integração via JWT já existente no módulo `calls`                      |

**Atenção operacional:** o clone local `/home/mel/Documentos/rede` está **977 commits atrás** da
`qa` real. Toda leitura de código do backend deve ser feita por
`git show enois/qa:<caminho>` ou num worktree novo a partir de `origin/qa`. Não trabalhar no
checkout atual.

---

## 3. Arquitetura identificada

### Backend (`com.socialcoisa.rede`, 41 pacotes, arquitetura hexagonal por módulo)

Cada módulo segue `domain/` + `application/` (+ `application/port/in`, `port/out`) + `adapters/in/web`

- `adapters/out/persistence`. Um `*Module.java` faz a fiação. A base tem um pacote `apiv1` que
  registra o contrato versionado `/api/v1`.

Peças reaproveitáveis já existentes:

- **Outbox transacional** (`shared/outbox`): `OutboxEventJpaEntity`, `OutboxWorker`,
  `OutboxHandlerReceiptJpaEntity` (recibo por handler, dá idempotência), `OutboxRetentionWorker`.
  É o mecanismo certo para "cancelou evento → notificar participantes" sem chamada externa na
  transação.
- **Workers `@Scheduled`** (42 ocorrências na base): padrão `fixedDelayString` configurável +
  `try/catch` que loga e não derruba o laço. O modelo para lembretes é
  `feed/application/ScheduledPostPublishWorker.java` + `ScheduledPostService.publishDue()`
  (`findDue(now, maxAttempts, limite)`, `attempts` na linha, erro vira registro com motivo).
- **Notificações** (`notifications`): `Notification.create(id, userId, kind, actorId, title, body,
href, ctaLabel, now)`, com `NotificationCreatedEvent` + handler de outbox. Já existe preferência
  por módulo (`NotificationPreferenceController`).
- **Chamadas** (`calls`): `CallSessionJpaEntity` com `event_id` (V256), `CallExpiryWorker`,
  `EpapoMeetingTokenIssuer`, `CallAudience`, `CallRoomAuthorization`. Sala é criada sob demanda, não
  permanente.
- **Mentoria** (`mentoring`): `MentorSlot` já tem `startsAt`/`endsAt` como `Instant` e flag
  `available`; `MentorSession` tem `SCHEDULED`. É o único módulo hoje com horário tipado de verdade.

### Frontend (`connect-grow`, React 19 + TanStack Start/Router)

- 69 arquivos em `src/routes/`, **nenhuma** rota de agenda/calendário.
- Rotas protegidas em `src/lib/require-auth.ts:20` (`PROTECTED_ROUTES` casa por prefixo).
- Menu em `src/components/navigation-items.ts` (com `module` validado pelo backend em
  `/me/preferences`); `/eventos` já usa o ícone `Calendar` (`navigation-items.ts:60`).
- Caminho de módulo em `src/lib/module-paths.ts:16`.
- SSR + hidratação exigem revalidação no cliente: `beforeLoad` não roda em deep link servido por SSR.

### Design System

Componentes existentes que serviram de base: `dialog`, `popover`, `sheet`, `tabs`, `pill`,
`badge`, `button`, `input`, `label`, `empty-state`, `loading-state`, `skeleton`, `toast`,
`page-header`, `confirm-dialog`, `char-counter`.
Já existe domínio de eventos: `domain/events/{event-card, event-recurrence-control,
event-recurrence-field, recurrence}` — **reaproveitar a recorrência em vez de criar outra**.
Datas: `lib/date-input` (`maskDate`, `displayToIso`, `isoToDisplay`) é entrada de data digitável,
não um calendário. **Não existe** date picker, month/week/day view, seletor de fuso, de lembrete
ou de disponibilidade.

---

## 4. Inventário — o que existe e o que falta

| Funcionalidade                | Frontend                            | Backend                                                         | Design System                                         | Situação                                                     |
| ----------------------------- | ----------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Agenda social                 | não existe                          | `calendar_entries` com `scope=SOCIAL`                           | visões prontas (PR #164)                              | **Parcial** — falta a tela                                   |
| Agenda profissional           | não existe                          | `calendar_entries` com `scope=PROFESSIONAL`                     | visões prontas (PR #164)                              | **Parcial** — falta a tela                                   |
| Visualização consolidada      | não existe                          | leitura sem `scope` devolve as duas                             | visões prontas (PR #164)                              | **Parcial** — falta a tela                                   |
| Motor central de compromissos | não existe                          | `CalendarEntry` + leitura, escrita e convites                   | —                                                     | **Parcial** — falta disponibilidade, recorrência e lembretes |
| Eventos                       | `/eventos` (vitrine), `eventos.tsx` | `events` (Event + Attendee)                                     | `event-card`, recorrência                             | **Existe parcial** — data/hora são texto livre               |
| Mentorias                     | `/mentoria`                         | `mentoring` (`MentorSlot` tipado)                               | não existe picker de slot                             | **Existe parcial** — sem agenda e sem conflito               |
| Entrevistas / vagas           | `/vagas`, candidaturas              | `jobs`                                                          | —                                                     | **Não integrado a agenda**                                   |
| Chamadas Épapo                | painel de chamada + iframe          | `calls` com `event_id` (V256)                                   | —                                                     | **Existe**, sem agendamento                                  |
| Salas do Tamo Junto           | barra do encontro                   | `calls` (sala por evento)                                       | —                                                     | **Existe**, sem compromisso com hora                         |
| Convites / participantes      | parcial em eventos                  | `calendar_entry_participants` (V258), convite pelo @ e resposta | linha de convite com Aceitar/Talvez/Recusar (PR #164) | **Parcial** — falta a tela                                   |
| Disponibilidade / conflitos   | não existe                          | slot de mentor isolado                                          | não existe                                            | **A construir**                                              |
| Lembretes                     | não existe (o DS não tem seletor)   | `calendar_reminders` (V264), worker de 30 s e rotas por entrada | não existe                                            | **Backend pronto** (#604); falta o seletor no DS e a tela    |
| ICS export/import             | não existe                          | não existe                                                      | não existe                                            | **A construir**                                              |
| Assinatura privada `.ics`     | não existe                          | não existe                                                      | não existe                                            | **A construir**                                              |
| Google/Microsoft/Apple        | não existe                          | OAuth existe no `identity` como base                            | —                                                     | **A construir**                                              |

### Dívida encontrada que bloqueia a agenda

1. **`events.domain.Event` guarda `date` e `time` como `String` de texto livre**
   (`events/domain/Event.java:6-7`), com parser tolerante em `expiresAt()` para ISO e `dd/MM/yyyy`.
   O front tem o mesmo formato (`src/types/application/event/event.ts`: `date: string; time:
string`). Nenhuma consulta por intervalo é possível; nenhum fuso, nenhuma duração.
   Isso precisa de coluna tipada **antes** de qualquer calendário.
2. Não existe `timezone` em lugar nenhum do domínio de eventos ou mentoria.
3. Não há noção de "participante com estado de convite" fora de `EventAttendee` (contagem).

---

## 5. Contratos a definir (antes de implementar)

Ver [`ENOIS-CALENDAR-ARCHITECTURE.md`](ENOIS-CALENDAR-ARCHITECTURE.md) para o raciocínio.
Resumo do que será decidido na Fase 1:

- `CalendarEntry` (compromisso) como entidade única com `scope` (`SOCIAL` | `PROFESSIONAL`),
  `kind`, início/fim em `Instant` + `timeZoneId`, e `sourceRef` (evento, mentoria, vaga, chamada).
- Conceitos separados: **entrada**, **convite** (estado por participante), **recorrência**
  (regra), **exceção** (ocorrência alterada), **disponibilidade** (janela), **sala** (chamada).
- Idempotência obrigatória por `sourceRef` — um reagendamento de mentoria atualiza a mesma entrada,
  não cria outra.

---

## 6. Fases e dependências

Ordem obrigatória. Cada fase pode exigir várias execuções.

| Fase | Escopo                                                                   | Depende de   | Estado                                                                                                                                         |
| ---- | ------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Inventário + roadmap + contratos                                         | —            | **concluída**                                                                                                                                  |
| 1    | Fundação: entidades, migrations, serviço, endpoints, autorização, testes | 0            | **concluída** (V257 modelo, leitura, escrita idempotente, convites/participantes com V258, detalhe com o lugar do leitor e convites pendentes) |
| 2    | Design System: calendário mês/semana/dia/lista, alternância, estados     | 1 (contrato) | **concluída** — #164/#165/#166 **mergeados**; falta só o release 0.30.0 (enois-design-system#172) |
| 3    | Frontend das agendas: navegação, 3 visões, criação, edição, detalhes     | 1, 2         | **em andamento** — `/agenda` pronta no #769; detalhe `/agenda/$entryId` pronto no DS #177 + front #777 (draft, espera o release do DS); falta o seletor de lembrete no DS/front (#604 já entrega a API) |
| 4    | Agenda social: chamadas, eventos de grupo/comunidade, pessoais           | 3            | pendente                                                                                                                                       |
| 5    | Agenda profissional: entrevistas, mentorias, reuniões, workshops         | 3            | pendente                                                                                                                                       |
| 6    | Disponibilidade e conflitos                                              | 1            | pendente                                                                                                                                       |
| 7    | Épapo e Tamo Junto vinculados a compromisso                              | 1, 4         | pendente                                                                                                                                       |
| 8    | iCalendar export/import                                                  | 1            | pendente                                                                                                                                       |
| 9    | Assinatura privada e cache                                               | 8            | pendente                                                                                                                                       |
| 10   | Provedores externos (Google/Microsoft/Apple)                             | 8, 9         | pendente                                                                                                                                       |
| 11   | Revisão geral: regressão, segurança, a11y, performance                   | todas        | pendente                                                                                                                                       |

---

## 7. PRs

| PR                                                                 | Repositório         | Escopo                                                                                                        | Estado                                          |
| ------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [#740](https://github.com/Rede-ENois/enois-frontend/pull/740)      | enois-frontend      | Documentação: roadmap, arquitetura e log                                                                      | **mergeado** em `6765a46a` (2026-11-08)         |
| [#531](https://github.com/Rede-ENois/enois-backend/pull/531)       | enois-backend       | Fase 1: modelo `calendar_entries` (V257) + persistência e consulta por janela                                 | **mergeado** em `6ac79d83` (2026-11-08, squash) |
| [#536](https://github.com/Rede-ENois/enois-backend/pull/536)       | enois-backend       | Fase 1: leitura da agenda (`GET /calendar/entries`, `GET /calendar/entries/{id}`) com autorização por dono    | **mergeado** em `3a803a01` (2026-11-08)         |
| [#742](https://github.com/Rede-ENois/enois-frontend/pull/742)      | enois-frontend      | Documentação: execução 3                                                                                      | **mergeado** em `cd193381` (2026-11-08)         |
| [#538](https://github.com/Rede-ENois/enois-backend/pull/538)       | enois-backend       | Fase 1: escrita da agenda (`POST`, `PATCH`, `DELETE` cancelando) com `Idempotency-Key` e autorização por dono | **mergeado** em `422d852e` (2026-11-08)         |
| [#744](https://github.com/Rede-ENois/enois-frontend/pull/744)      | enois-frontend      | Documentação: execução 4                                                                                      | **mergeado** em `2b82fd3b` (2026-11-08)         |
| [#745](https://github.com/Rede-ENois/enois-frontend/pull/745)      | enois-frontend      | Documentação: execução 5 e decisões D13/D14                                                                   | **mergeado** em `ba8ee20f` (2026-11-08)         |
| [#541](https://github.com/Rede-ENois/enois-backend/pull/541)       | enois-backend       | Fase 1: convites e participantes (`V258`, convite pelo @, resposta, agenda do convidado)                      | **mergeado** em `358acbcc` (2026-11-08)         |
| [#542](https://github.com/Rede-ENois/enois-backend/pull/542)       | enois-backend       | Fase 1: detalhe com o lugar do leitor e `GET /calendar/invitations` (convites pendentes)                      | **mergeado** (2026-11-08)                       |
| [#746](https://github.com/Rede-ENois/enois-frontend/pull/746)      | enois-frontend      | Documentação: execução 6 e decisão D15                                                                        | **mergeado** em `eb80d9e2` (2026-11-08)         |
| [#164](https://github.com/Rede-ENois/enois-design-system/pull/164) | enois-design-system | Fase 2: agenda no DS (mês, semana, dia, lista) e a alternância entre as visões                                | **mergeado** em `0edf762` (2026-11-08)          |
| [#165](https://github.com/Rede-ENois/enois-design-system/pull/165) | enois-design-system | Fase 2: formulário de compromisso (criar/editar), relógio de parede com DST e `TimeTextInput`                 | **mergeado** (2026-11-09)                       |
| [#750](https://github.com/Rede-ENois/enois-frontend/pull/750)      | enois-frontend      | Documentação: execução 8                                                                                      | **mergeado** em `3f272c14` (2026-11-08)         |
| [#166](https://github.com/Rede-ENois/enois-design-system/pull/166) | enois-design-system | Fase 2: superfície que monta a agenda com o formulário (criar/editar, fechar só no salvamento aprovado)       | **mergeado** (2026-11-09)                       |
| [#751](https://github.com/Rede-ENois/enois-frontend/pull/751)      | enois-frontend      | Documentação: execução 9 e decisão D18                                                                        | **mergeado** em `1d0e9694` (2026-11-08)         |
| [#752](https://github.com/Rede-ENois/enois-frontend/pull/752)      | enois-frontend      | Fase 3: tipos do contrato e cliente `calendarApi` (janela obrigatória, convite sem `INVITED`)                    | **mergeado** (2026-11-09)                       |
| [#568](https://github.com/Rede-ENois/enois-backend/pull/568)       | enois-backend       | Fase 1: origem da mentoria na agenda central (`CalendarSourceService`, V260 com índice único por dono)          | **mergeado** em `83515ce8` (2026-11-09); a V260 foi renumerada para V262 no #584 |
| [#584](https://github.com/Rede-ENois/enois-backend/pull/584)       | enois-backend       | Colisão de migração: a `qa` tinha duas V260 e o boot quebrava; a do calendário virou V262                      | **mergeado** em `a14cb468` (2026-11-09)         |
| [#171](https://github.com/Rede-ENois/enois-design-system/issues/171) | enois-design-system | Issue do release 0.30.0: publica o módulo `domain/calendar`, que nunca saiu no pacote                        | aberta                                          |
| [#172](https://github.com/Rede-ENois/enois-design-system/pull/172) | enois-design-system | Release `chore(release): 0.30.0` a partir do `main`                                                          | **mergeado** (2026-11-09); tag `v0.30.0` publicada e pacote no registro |
| [#769](https://github.com/Rede-ENois/enois-frontend/pull/769)      | enois-frontend      | Fase 3: rota `/agenda` com as quatro visões, alternância de agenda, criação e resposta a convite              | aberto, **aguardando revisão humana**           |
| [#604](https://github.com/Rede-ENois/enois-backend/pull/604)       | enois-backend       | Lembrete de compromisso: `CalendarReminder` (V264), CRUD em `/calendar/entries/{id}/reminders`, entrega única pelo worker de outbox (D4/D21) | **mergeado** em `59cb2018` (2026-11-10); mergeado pelo bot `kof-agent-worker` sem aprovação humana — ver B8 |
| [#177](https://github.com/Rede-ENois/enois-design-system/pull/177) | enois-design-system | Fase 3: `CalendarEntryDetail` (detalhe do compromisso com o lugar do leitor, convites e microcópia)          | **mergeado** em `3776208` (2026-11-10)          |
| [#180](https://github.com/Rede-ENois/enois-design-system/pull/180) | enois-design-system | Release `chore(release): 0.30.1` a partir do `main`                                                          | aberto; **tag `v0.30.1` já publicada** e pacote no registro |
| [#777](https://github.com/Rede-ENois/enois-frontend/pull/777)      | enois-frontend      | Fase 3: rota `/agenda/$entryId` (detalhe do compromisso, editar, cancelar, responder, convidar)              | aberto, **aguardando revisão humana**; CI 100% verde com o DS 0.30.1 |

Regra: **sem merge automático**. Todo PR fica aguardando revisão humana. Um PR por escopo
delimitado; dependências declaradas no corpo.

---

## 8. Testes executados

Última execução (backend, `feat/enois-calendar-mentoring-source` sobre a `qa` `da71ae95`),
`./mvnw -o test -Dtest=...`:

| Classe                                                          | Testes | Resultado                                                                                     |
| --------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `CalendarSourceServiceTests`                                    | 7      | verde (upsert idempotente, reagendamento na mesma linha, unicidade por dono, cancelado não volta) |
| `MentoringCalendarSyncTests`                                    | 2      | verde (sessão marcada entra na agenda do mentorado; cancelamento cancela a entrada)            |
| `CalendarEntryPersistenceTests`                                 | 5      | verde                                                                                          |
| `Calendar*Tests`, `Mentor*Tests`, `Mentoring*Tests` (regressão)  | 83     | **0 falhas**, BUILD SUCCESS (9m08s)                                                            |

Execução anterior (front, `feat/enois-calendar-api` sobre a `qa` `1d0e9694`):

| Comando                   | Resultado                                                             |
| ------------------------- | --------------------------------------------------------------------- |
| `npm run typecheck`       | `EXIT=0`                                                              |
| `npm run lint`            | `EXIT=0`, 0 erros; 9 warnings que já existiam fora desta unidade     |
| `npm test`                | **1196 testes, 0 falhas** (9 deles desta unidade)                     |
| `npm run build`           | `EXIT=0`                                                              |

Execução anterior (design system, `feat/calendar-agenda-surface` sobre `feat/calendar-views` `585e911`,
versão 0.29.9):

| Comando                   | Resultado                                                                     |
| ------------------------- | ----------------------------------------------------------------------------- |
| `npm run lint`            | `EXIT=0`, 0 erros; 6 warnings que já existiam fora do calendário              |
| `npm run typecheck`       | `EXIT=0`                                                                      |
| `npm test`                | 162 arquivos, **1373 testes, 0 falhas** (6 deles desta unidade)               |
| `npm run build`           | `EXIT=0`                                                                      |
| `npm run test:dist`       | `EXIT=0` (`ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain`)                  |
| `npm run build-storybook` | `EXIT=0`                                                                      |

Execução anterior (design system, `feat/calendar-views`, árvore final sobre a `qa` `ed52c3c`,
versão 0.29.9):

| Comando                   | Resultado                                                                     |
| ------------------------- | ----------------------------------------------------------------------------- |
| `npm run lint`            | `EXIT=0`, 0 erros; 6 warnings que já existiam fora do calendário              |
| `npm run typecheck`       | `EXIT=0`                                                                      |
| `npm test`                | 161 arquivos, **1367 testes, 0 falhas** (54 deles desta unidade)              |
| `npm run build`           | `EXIT=0`                                                                      |
| `npm run test:dist`       | `EXIT=0` (`ok .`, `ok ./ui`, `ok ./patterns`, `ok ./domain`)                  |
| `npm run build-storybook` | `EXIT=0`                                                                      |

Execução anterior (design system, `feat/calendar-views`, árvore final sobre a `qa` `3f7a756`,
versão 0.29.9):

| Comando                   | Resultado                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run lint`            | `EXIT=0`, 0 erros; 5 warnings que já existiam fora do calendário |
| `npm run typecheck`       | `EXIT=0`                                                         |
| `npm test`                | 155 arquivos, **1313 testes, 0 falhas** (24 deles da agenda)     |
| `npm run build`           | `EXIT=0`                                                         |
| `npm run test:dist`       | `EXIT=0` (`ok .`, `./ui`, `./patterns`, `./domain`)              |
| `npm run build-storybook` | `EXIT=0`                                                         |

Execução anterior (backend, `feat/enois-calendar-detalhe`, árvore final sobre a `qa` `358acbcc`),
`./mvnw -o test -Dtest=...`:

| Classe                                        | Testes | Resultado                                                                                                                          |
| --------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CalendarDetailAndPendingInvitationsApiTests` | 6      | verde (detalhe do convidado sem lista, 404 de estranho, detalhe do dono com participantes, pendentes, cancelada fora, alias `/v1`) |
| `CalendarInvitationApiTests`                  | 11     | verde (convite pelo @, 409 repetido, 404 alheio, resposta, agenda do convidado, remoção)                                           |
| `CalendarEntryWriteApiTests`                  | 9      | verde (contrato HTTP da escrita: 201, 400, 404, idempotência, cancelamento)                                                        |
| `CalendarEntryReadApiTests`                   | 9      | verde (contrato HTTP da leitura)                                                                                                   |
| `CalendarEntryTests`                          | 8      | verde                                                                                                                              |
| `CalendarEntryPersistenceTests`               | 5      | verde                                                                                                                              |
| `MariaDbReservedWordsTests`                   | 2      | verde (guarda de migration)                                                                                                        |
| `FlywayMigrationConfigTests`                  | 5      | verde (inclui unicidade de versão)                                                                                                 |
| `AutomatedWritePathsTests`                    | 2      | verde (rota nova de escrita nasce protegida)                                                                                       |

O gate de cada execução fica registrado no log de execução.

---

## 9. Bloqueios e problemas conhecidos

| #   | Problema                                                                             | Impacto                                             | Encaminhamento                                                                   |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| B1  | `enois-backend` local 977 commits atrás da `qa`                                      | leitura de código errada e branch desatualizada     | usar `git show enois/qa:` ou worktree novo; **nunca** commitar no checkout atual |
| B2  | `Event.date`/`time` são texto; front igual                                           | sem consulta por intervalo, sem fuso                | corrigir na Fase 1 com coluna tipada + backfill                                  |
| B3  | Sem `timezone` no domínio                                                            | recorrência e ICS errados                           | decidir na arquitetura (guardar `Instant` + `ZoneId` do organizer)               |
| B4  | `@rede-enois/design-system` é pacote privado e o token local não tem `read:packages` | build/typecheck local falha fora da versão em cache | usar o tarball da versão do lock quando disponível; declarar no PR               |
| B5  | Sem navegador utilizável para prova visual nesta máquina                             | não há captura de tela                              | usar Chrome headless + CDP; quando não der, declarar a limitação no PR           |
| B6  | Nenhuma versão **publicada** do DS tem o módulo de calendário                        | a tela `/agenda` não pode importar `CalendarAgenda`  | **fechado**: `v0.30.0` (agenda) e `v0.30.1` (detalhe) publicadas; os dois PRs do front compilam contra o registro |
| B7  | Sem token `read:packages` nesta máquina                                              | não dá para `npm ci`/`npm install` do front nem regerar o lockfile | **mitigado**: workflow descartável com `GITHUB_TOKEN` regerou os lockfiles do #769 (0.30.0) e do #777 (0.30.1). Processo: `.github/workflows/relock-ds.tmp.yml`, removido depois de cada uso |
| B8  | O bot `kof-agent-worker` mergea PRs na `qa` sem aprovação humana (ex.: backend #604) | contraria a regra absoluta do projeto: nenhum merge automático | reportado à mantenedora na execução 14; decisão sobre a proteção de branch é do time — nenhum bypass foi feito por mim |

---

## 10. Próxima tarefa prioritária

> **Modo de execução (decisão da mantenedora, 2026-11-09):** a partir da execução 15, cada rodada
> entrega um **bloco de 2–4 unidades verificáveis** (uma fase ou um recorte dela), não uma unidade
> só. Quando uma frente travar em revisão humana ou release, a rodada avança uma unidade
> independente de outra fase no mesmo bloco.

**Execução 17 (bloco) — lembretes no front, disponibilidade e o que destravar.**

1. **Destravar o #777** quando o DS #177 for revisado e uma versão nova (0.30.1) publicada: rodar
   `npm install @rede-enois/design-system@<nova>` no worktree do `feat/enois-calendar-detail`,
   commitar o lockfile (mesmo workflow descartável da execução 14), tirar o PR do draft.
   Antes disso o CI do #777 fica vermelho por design — está declarado no corpo do PR.
2. **Lembrete no front**: o backend já entrega
   `GET/PUT/DELETE /calendar/entries/{id}/reminders` (mergeado no #604, `qa` `59cb2018`).
   O DS ainda não tem seletor de lembrete — criar o componente no DS (mesmo padrão do
   `CalendarEntryFormDialog`: superfície controlada, microcópia própria) e ligar na rota de
   detalhe. Cuidado com a semântica D21 (lembrete relativo ao `startsAt`, entrega única, `sentAt`
   nulo nos pendentes).
3. **Disponibilidade e conflitos (fase 6)**: inventariar o que já existe no backend para janelas
   de disponibilidade e detecção de sobreposição antes de desenhar a tela.

**Lição da execução 15.** O roadmap estava desatualizado de novo: listava #542, #165, #166, #752
e o release #172 como abertos, mas todos estão mergeados; e o #604 (lembrete) foi mergeado pelo
bot `kof-agent-worker` sem revisão humana (B8). Conferir PR por PR com `gh pr view` levou minutos
e evitou construir sobre premissa errada.

## 11. Histórico de execuções (resumo)

| #   | Data/hora         | Fase | Resultado                                                                                                                                                                                                                                              |
| --- | ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 2026-11-08 ~09:40 | 0    | Inventário dos 4 repositórios, matriz de funcionalidades, dívida de data/hora, roadmap e arquitetura escritos; docs no PR #740                                                                                                                         |
| 2   | 2026-11-08 ~13:10 | 1    | `calendar_entries` (V257) + domínio + porta/adaptador + 20 testes verdes; backend PR #531                                                                                                                                                              |
| 3   | 2026-11-08 ~08:40 | 1    | Serviço de leitura + `GET /calendar/entries` e `/{id}` com autorização por dono + 9 testes de contrato verdes; backend PR #536; docs no PR #742                                                                                                        |
| 4   | 2026-11-08 ~09:35 | 1    | Escrita da entrada (`POST`, `PATCH`, `DELETE` cancelando) com validação, `Idempotency-Key` e autorização por dono + 9 testes de contrato verdes; 40 testes verdes na suíte do calendário e guardas                                                     |
| 5   | 2026-11-08 ~10:40 | 1    | Convites e participantes (`V258`): convite pelo @, resposta por participante, remoção pelo organizador e agenda do convidado com o estado do convite + 11 testes de contrato; 51 testes verdes na suíte do calendário e guardas                        |
| 6   | 2026-11-08 ~11:45 | 1    | Detalhe com o lugar do leitor (`{ entry, owner, participation, participants }`, lista só para o organizador) e `GET /calendar/invitations` com os pendentes + 6 testes de contrato; 57 testes verdes na suíte do calendário e guardas; backend PR #542 |
| 7   | 2026-11-08 ~13:35 | 2    | `CalendarAgenda` no DS com mês, semana, dia e lista, alternância, 21 tipos, microcópia, quatro ajudantes de data/grade e story; 24 testes da feature e 1313 verdes na suíte inteira; DS PR #164                                                        |
| 8   | 2026-11-08 ~20:20 | 2    | Relógio de parede com DST (`instantOf`/`wallClockOf`), `TimeTextInput`, correção de `isDay` (dia inexistente era aceito) e o diálogo de criar/editar compromisso, com as regras do rascunho nos tetos da API; 54 testes da unidade e 1367 verdes na suíte inteira; DS PR #165 |
| 9   | 2026-11-08 ~21:20 | 2    | `CalendarAgendaSurface` no DS: agenda + formulário com salvar controlado (fecha só no `true`, recusa mantém o digitado), dia inicial do que está na tela; 6 testes e 1373 verdes na suíte inteira; DS PR #166 |
| 10  | 2026-11-08 ~22:00 | 3    | Tipos do contrato do calendário e `calendarApi` no front (janela obrigatória, `scope` omitido em branco, resposta de convite sem `INVITED`, cancelamento devolvendo a entrada marcada); 9 testes de contrato; bloqueio B6 registrado (DS publicado sem o módulo) |
| 11  | 2026-11-09 ~00:30 | 1    | Origem da mentoria na agenda central: `CalendarSourceService` (upsert/cancel idempotente por origem), V260 com índice único por dono, `MentorService` gravando e cancelando a entrada; 9 testes da unidade e 83 verdes na regressão; backend PR #568 |
| 12  | 2026-11-09 ~19:10 | 3    | Retomada após a sessão anterior morrer. Inventário do estado real (todos os PRs de calendário mergeados; o bloqueio era só o release). Release 0.30.0 preparado no DS (#172/#171) com o gate completo verde; rota `/agenda` escrita no front (#769) com 3 testes, typecheck, lint e build verdes contra o tarball do DS; menu em `explore` (D16), período/visão/agenda na URL, janela convertida com `instantOf` |
| 13  | 2026-11-09 ~21:40 | 1/6  | Lembretes de compromisso de ponta a ponta no backend: `calendar_reminders` (V264), domínio com teto de 3 tentativas, worker de 30 s enviando pelo `NotificationService`, checagem de participação no envio, encerramento no cancelamento/reagendamento e rotas no controller de entradas; 15 testes da unidade e 81 na regressão; backend PR #604 |
| 14  | 2026-11-09 ~22:30 | 3    | Tag `v0.30.0` publicada; lockfile do #769 regerado contra o pacote real (workflow descartável) e PR tirado do draft; `CalendarEntryDetail` no DS (#177) com 12 testes e 53 no módulo |
| 15  | 2026-11-09 ~23:45 | 3    | Rota `/agenda/$entryId` no front (#777, draft): detalhe com o lugar do leitor, editar, cancelar, responder, convidar e remover; 5 testes (8 com a `/agenda`), tsc/eslint/build verdes. Estado real dos PRs reconferido e §7/§9 corrigidos; B8 registrado (merge automático do bot) |
| 16  | 2026-11-10 ~01:45 | 3    | Release 0.30.1 do DS: #177 mergeado, PR de release #180, tag `v0.30.1` empurrada e publicada. Front #777 no 0.30.1 com lockfile real, `qa` mesclada (eliminou lint de arquivo desatualizado), CI **100% verde** e PR fora do draft. Merge da `qa` no branch de docs e conflitos resolvidos preservando D21 e as execuções 11–13 |
---

## 12. Critérios de encerramento do cronjob

A execução horária só se encerra quando **todos** os itens abaixo forem verdadeiros, e cada um com
prova executada nesta linha de trabalho, não com intenção:

1. As fases 0 a 11 da seção 6 estão concluídas.
2. Todas as funcionalidades da seção 4 (inventário) estão implementadas — nenhuma linha continua
   como "A construir".
3. Frontend, backend e Design System estão integrados: existe tela consumindo o endpoint de cada
   fluxo, e o componente do Design System é o usado pela tela.
4. `npm run lint`, `npm run typecheck`, `npx vitest run` e `npm run build` no front e `./mvnw test`
   no backend verdes na árvore final.
5. Os critérios de aceitação das seções 5 a 12 estão satisfeitos, cada um com teste ou verificação
   de tela registrada no log.
6. Não existe tarefa de implementação pendente na seção 10.
7. Nenhuma funcionalidade está em placeholder, stub ou TODO.
8. Os três documentos de `docs/engineering/` estão atualizados com a última execução.
9. Todos os PRs produzidos estão listados na seção 7 com link.
10. Só resta bloqueio externo (credencial OAuth de provedor) — e ele está escrito com o
    encaminhamento, sem impedir nenhuma outra funcionalidade.

PR aberto aguardando revisão humana **não** impede o encerramento: o trabalho está entregue, e o
merge é decisão do time. Estado terminal, ao encerrar:

```
PROJECT_STATUS=COMPLETED
CRONJOB_STATUS=DISABLED
COMPLETED_AT=<timestamp>
```

Em dúvida, o cronjob continua ativo. Nunca encerrar com fase incompleta, teste pendente ou PR
parcialmente implementado.
