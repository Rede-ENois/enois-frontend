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
FASE_ATUAL=9 (assinatura privada .ics) entregue no backend: link /calendar/subscribe/{token}.ics sem sessão, token guardado só como hash, regenerar/revogar cortando o link antigo, ETag e limite por token (backend #637, aguardando revisão humana). Fase 4 (agenda social) segue em andamento com a presença em evento (D27). Fase 3 concluída: seletor de lembrete ligado em /agenda/$entryId (DS #203 + front #813, aguardando revisão humana). Fase 8 concluída (export+import #629, botão #809). Regressão completa do backend: 2335 testes, 1 falha de feed comprovadamente flaky.
EXECUCAO=22
ULTIMA_ATUALIZACAO=2026-11-10T23:20:00-03:00
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
| Disponibilidade / conflitos   | **tela e aviso prontos** (#804)     | conflito (#607) + janela semanal (V267, #613)                   | **superfície + repasse de `conflicts`** (#197); aviso no formulário (#195) | **Completo na `qa`** — #804 mergeado e 0.31.0 publicado (tag `v0.31.0`, #197 incluso) |
| Lembretes                     | não existe (o DS não tem seletor)   | `calendar_reminders` (V264), worker de 30 s e rotas por entrada | não existe                                            | **Backend pronto** (#604); falta o seletor no DS e a tela    |
| ICS export/import             | **botão de download na `/agenda`** (#809) | **export + import** (#629, fase 8)                         | — (o botão é o `Button` do DS)                        | **Parcial** — export e import entregues; falta assinatura (fase 9) |
| Assinatura privada `.ics`     | cliente de API pronto (#816)        | **rotas prontas** (#637): gestão com sessão + leitura sem sessão | —                                                     | **Backend pronto** — V272, ETag, limite por token; falta a tela         |
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
| 3    | Frontend das agendas: navegação, 3 visões, criação, edição, detalhes     | 1, 2         | **concluída** — `/agenda` (#769) e detalhe `/agenda/$entryId` (#777) mergeados; lembretes, conflito e disponibilidade no cliente; seletor de lembrete no DS (#187, 0.31.0) e **ligado na tela** (execução 21) |
| 4    | Agenda social: chamadas, eventos de grupo/comunidade, pessoais           | 3            | **em andamento** — eventos de grupo: presença confirmada cria/reagenda/remove a entrada (origem `EVENT`, D27); faltam chamadas e compromissos pessoais |
| 5    | Agenda profissional: entrevistas, mentorias, reuniões, workshops         | 3            | pendente                                                                                                                                       |
| 6    | Disponibilidade e conflitos                                              | 1            | **concluída** — backend (#607, #613), DS #197 (mergeado `bdf7370`), front #804 **mergeado na `qa`**; release **0.31.0 publicado** pela mantenedora (tag `v0.31.0`) |
| 7    | Épapo e Tamo Junto vinculados a compromisso                              | 1, 4         | pendente                                                                                                                                       |
| 8    | iCalendar export/import                                                  | 1            | **concluída** — export+import no backend (#629) e botão de download na `/agenda` (#809), ambos mergeados na `qa` |
| 9    | Assinatura privada e cache                                               | 8            | **concluída no backend** — V272, token só como hash, rota sem sessão com ETag, regenerar/revogar e limite por token (backend #637, aguardando revisão humana); cliente no front (#816) |
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
| [#180](https://github.com/Rede-ENois/enois-design-system/pull/180) | enois-design-system | Release `chore(release): 0.30.1` a partir do `main`                                                          | **mergeado**; tag `v0.30.1` publicada |
| [#777](https://github.com/Rede-ENois/enois-frontend/pull/777)      | enois-frontend      | Fase 3: rota `/agenda/$entryId` (detalhe do compromisso, editar, cancelar, responder, convidar)              | **mergeado** na `qa` (`66e5f330`, 2026-11-10) |
| [#187](https://github.com/Rede-ENois/enois-design-system/pull/187) | enois-design-system | Fase 3/6: `CalendarReminderSelector` (radiogroup acessível, 5 antecedências + "não avisar", saving/erro)      | **mergeado** em `d1d128f0` (2026-11-10) pelo bot `kof-agent-worker` — ver B8; entra no release #196 |
| [#786](https://github.com/Rede-ENois/enois-frontend/pull/786)      | enois-frontend      | Fase 3: cliente de API dos lembretes (`list/set/clearReminder`)                                               | **mergeado** em `4b9c3cf9` (2026-11-10) pelo bot `kof-agent-worker` — **antes do push da unidade de conflito**, que ficou de fora; ver B8 |
| [#607](https://github.com/Rede-ENois/enois-backend/pull/607)       | enois-backend       | Fase 6: `CalendarConflictService` + `GET /calendar/entries/conflicts` (leitura, não bloqueio; sem migração)   | **mergeado** em `b1e65d92` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#792](https://github.com/Rede-ENois/enois-frontend/pull/792)      | enois-frontend      | Fase 6: cliente de API do conflito (`CalendarConflictQuery` + `calendarApi.conflicts`), recortado da `qa` atual | **mergeado** em `7e160805` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#195](https://github.com/Rede-ENois/enois-design-system/pull/195) | enois-design-system | Fase 6: aviso de conflito no `CalendarEntryFormDialog` (recorte no rascunho, meio-aberto, sem bloquear o salvar) | **mergeado** em `3604673a` (2026-11-10) pelo bot `kof-agent-worker` — ver B8; entra no release #196 |
| [#613](https://github.com/Rede-ENois/enois-backend/pull/613)       | enois-backend       | Fase 6: disponibilidade semanal da agenda (`calendar_availability` V267, `GET`/`PUT /calendar/availability`) | **mergeado** em `0bd98c2c` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#801](https://github.com/Rede-ENois/enois-frontend/pull/801)      | enois-frontend      | Fase 6: cliente de API da disponibilidade (`availability`/`setAvailability`)                                  | **mergeado** em `b089837b` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#778](https://github.com/Rede-ENois/enois-frontend/pull/778)      | enois-frontend      | Documentação: execução 14 (detalhe do compromisso e estado real dos PRs)                                     | **mergeado** em `517a3b9b` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#791](https://github.com/Rede-ENois/enois-frontend/pull/791)      | enois-frontend      | Documentação: execução 17 em bloco (lembretes, conflito, fase 6) e decisão D23                              | **mergeado** em `52c1a5d4` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#802](https://github.com/Rede-ENois/enois-frontend/pull/802)      | enois-frontend      | Documentação: execução 18 em bloco (disponibilidade, aviso de conflito) e decisão D24                       | **mergeado** em `09a75b9b` (2026-11-10) pelo bot `kof-agent-worker` — ver B8 |
| [#774](https://github.com/Rede-ENois/enois-frontend/pull/774)      | enois-frontend      | Documentação: B6 fechado (tag `v0.30.0`, tela verde)                                                         | **mergeado** na `qa` (`0ad051d9`) |
| [#196](https://github.com/Rede-ENois/enois-design-system/pull/196) | enois-design-system | Release `chore(release): 0.31.0` (pull-indicator, seletor de lembrete, aviso de conflito, badge kits)        | **mergeado**; tag `v0.31.0` publicada pela mantenedora (D20) |
| [#197](https://github.com/Rede-ENois/enois-design-system/pull/197) | enois-design-system | Fase 6: superfície de disponibilidade semanal (D24) + repasse de `conflicts` pela `CalendarAgendaSurface`    | **mergeado** em `bdf7370`; incluído no **0.31.0 publicado** (tag `v0.31.0`, run 42869575669) |
| [#804](https://github.com/Rede-ENois/enois-frontend/pull/804)      | enois-frontend      | Fase 6: tela `/agenda/disponibilidade` + aviso de conflito ligado na `/agenda`                              | **mergeado** na `qa` (após sair do draft com o lockfile real do 0.31.0) |
| [#629](https://github.com/Rede-ENois/enois-backend/pull/629)       | enois-backend       | Fase 8: export e import de iCalendar (`export.ics` + `import` multipart)                                   | **mergeado** na `qa` (2026-11-10) |
| [#809](https://github.com/Rede-ENois/enois-frontend/pull/809)      | enois-frontend      | Fase 8: botão "Baixar .ics" na `/agenda` com a janela/escopo da tela                                       | **mergeado** na `qa` (2026-11-10) |
| [#810](https://github.com/Rede-ENois/enois-frontend/pull/810)      | enois-frontend      | Documentação: bloco 20 (iCalendar de ponta a ponta)                                                         | **mergeado** na `qa` (2026-11-10) |
| (backend, exec. 21)                                                | enois-backend       | Fase 4: presença em evento cria/reagenda/remove a entrada na agenda + porta de origem encerra lembrete      | aberto, aguardando revisão humana |
| (DS, exec. 21)                                                     | enois-design-system | Fase 3: slot `reminder` no `CalendarEntryDetail`                                                            | aberto, aguardando revisão humana |
| (front, exec. 21)                                                  | enois-frontend      | Fase 3: seletor de lembrete ligado em `/agenda/$entryId`                                                    | aberto, aguardando revisão humana; depende do slot no DS |

Regra: **sem merge automático**. Todo PR fica aguardando revisão humana. Um PR por escopo
delimitado; dependências declaradas no corpo.

---

## 8. Testes executados

Execução 22 (backend `feat/enois-calendar-assinatura-ics` sobre a `qa` `ef47dc96`; front
`feat/enois-calendar-assinatura-cliente` sobre a `qa` `7664b239`):

| Onde  | Comando                                                                                          | Resultado |
| ----- | ------------------------------------------------------------------------------------------------ | --------- |
| Backend | `-Dtest=CalendarSubscriptionTests`                                                             | **6/6** |
| Backend | `-Dtest=CalendarSubscriptionApiTests`                                                          | **9/9** |
| Backend | `-Dtest='Calendar*Tests,LinkPreviewRateLimit*,PublicReadRateLimit*,GlobalApiRateLimit*,AbuseGuard*,MissingSessionHeaderTests,ContractControllerTests'` | **153/153**, BUILD SUCCESS |
| Front | `npx vitest run src/lib/api/calendar.test.ts`                                                    | **22/22** (4 novos) |
| Front | `npx tsc --noEmit` / `npx eslint` nos arquivos tocados / `npx vite build`                        | EXIT=0 / 0 erros / EXIT=0 |

Execução 19 (DS `feat/calendar-availability-surface` @ `1a7ec87` sobre `main` `fabb777`; front
`feat/enois-calendar-availability-screen` @ `5c979ba0` sobre `qa` `1ed7284d`):

| Onde  | Comando                                                             | Resultado |
| ----- | ------------------------------------------------------------------- | --------- |
| DS    | `npx vitest run` da superfície de disponibilidade + regras do rascunho | **12/12** e **14/14** |
| DS    | `npx vitest run` da `CalendarAgendaSurface`                         | **8/8** (2 novos para o repasse de `conflicts`) |
| DS    | `npm test` (suíte inteira)                                          | **1655/1655**, 174 arquivos |
| DS    | `npm run lint` / `npx tsc --noEmit` / `npm run build`                | 0 erros / EXIT=0 / EXIT=0 |
| Front | `npx vitest run src/routes/agenda_.disponibilidade.test.tsx src/routes/agenda.test.tsx src/lib/query-options/calendar.test.ts` | **7/7** |
| Front | `npx vitest run` (suíte inteira)                                    | 1249/1254 — 5 timeouts PBKDF2 em `lib/e2e`, verdes isolados (20/20); nenhum teste de agenda falhou |
| Front | `npx tsc --noEmit`                                                  | 2 erros **pré-existentes** de `badgeKits` (não deste diff) |
| Front | `npx eslint` nos arquivos tocados / `npx vite build`                 | 0 erros / EXIT=0 |

Execução anterior (backend, `feat/enois-calendar-mentoring-source` sobre a `qa` `da71ae95`),
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
| `CalendarIcsServiceTests` (exec. 20)          | 11     | verde (UID estável, escape, cancelado com mesmo UID, escopo, folding ≤75 octets, round-trip sem duplicar, TZID, UTC/date-only, sem UID pulado, teto, janela) |
| `CalendarIcsApiTests` (exec. 20)              | 7      | verde (401 nos dois sentidos, `text/calendar` + attachment, 400 sem janela/key/arquivo, contagens + retry idempotente)             |

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
| B6  | Nenhuma versão **publicada** do DS tem o módulo de calendário                        | a tela `/agenda` não pode importar `CalendarAgenda`  | **fechado** (de novo): `v0.31.0` publicada pela mantenedora com o #197; o #804 mergeou na `qa` com o lockfile real. **Armadilhas**: trocar o tarball exige `rm -rf node_modules/.nitro`; lockfile regenerado pelo workflow descartável apagando a entrada antiga do pacote antes do `npm install --package-lock-only` |
| B7  | Sem token `read:packages` nesta máquina                                              | não dá para `npm ci`/`npm install` do front nem regerar o lockfile | **mitigado**: workflow descartável com `GITHUB_TOKEN` regerou os lockfiles do #769 (0.30.0) e do #777 (0.30.1). Processo: `.github/workflows/relock-ds.tmp.yml`, removido depois de cada uso |
| B8  | O bot `kof-agent-worker` mergea PRs sem aprovação humana — **execução 19**: mergeou #187 e #195 no DS e **abriu o PR de release #196** sozinho | contraria a regra absoluta do projeto: nenhum merge automático | reportado à mantenedora (execuções 14, 17 e 19); a publicação do release continua humana (D20: tag `v*`) e o bot não a dispara. Mitigação: PRs seguem declarando "não mergear" e a rodada não abriu PR duplicado do release |

---

## 10. Próxima tarefa prioritária

> **Modo de execução (decisão da mantenedora, 2026-11-09):** a partir da execução 15, cada rodada
> entrega um **bloco de 2–4 unidades verificáveis** (uma fase ou um recorte dela), não uma unidade
> só. Quando uma frente travar em revisão humana ou release, a rodada avança uma unidade
> independente de outra fase no mesmo bloco.

**Execução 17 (bloco) — lembretes no front, disponibilidade e o que destravar.**
*Executada em 2026-11-10 (~03:00–04:10). Cinco unidades: (A) #774 absorvido no #778;
(B) `CalendarReminderSelector` no DS (#187); (C) cliente de API dos lembretes no front (#786);
(D) inventário da fase 6 + detecção de conflito no backend (#607); (E) cliente de API do conflito
(#786). Detalhe no log, execução 17.*

1. **Destravar o #777** — **feito na execução 16** (release 0.30.1, CI verde, fora do draft).
2. **Lembrete no front** — **componente pronto** no DS (#187, 8 testes) e **cliente pronto** no
   front (#786). Falta o release do DS e ligar o seletor na rota de detalhe.
3. **Disponibilidade e conflitos (fase 6)** — **inventário feito e primeira peça entregue**:
   `CalendarConflictService` + `GET /calendar/entries/conflicts` (#607). O que falta na fase 6:
   janela de disponibilidade no nível da **agenda** (o `MentorAvailability` é por perfil de mentor:
   dia da semana + HH:mm, sem duração nem exceção) e o aviso de conflito dentro do
   `CalendarEntryFormDialog` do DS.

**Execução 18 (bloco) — disponibilidade semanal, aviso de conflito e cliente.**
*Executada em 2026-11-10 (~05:00–09:30). Três unidades: (A) disponibilidade semanal da agenda no
backend (V267, `GET`/`PUT /calendar/availability`, #613); (B) aviso de conflito no
`CalendarEntryFormDialog` do DS (#195); (C) cliente de API da disponibilidade no front (#801).
Detalhe no log, execução 18.*

1. **Disponibilidade semanal** — **feito no backend e no cliente**. Falta a tela.
2. **Aviso de conflito no formulário** — **feito no DS** (#195). Falta ligar na `/agenda` depois do
   release.
3. **Seletor de lembrete** — **ainda bloqueado** no #187 (aberto, `REVIEW_REQUIRED`, CI verde).

**Execução 19 (bloco) — disponibilidade, conflito e o release que veio do bot.**
*Executada em 2026-11-10 (~11:00–14:30). Três unidades: (A) superfície de disponibilidade semanal no
DS (#197); (B) repasse de `conflicts` pela `CalendarAgendaSurface` (#197, mesmo PR); (C) tela
`/agenda/disponibilidade` + aviso ligado na `/agenda` no front (#804). Detalhe no log, execução 19.*

1. **Superfície de disponibilidade** — **entregue** no DS (#197): semana editável, regras do backend
   (dia 1–7, `hh:mm`, fim depois do começo, meio-aberto, teto de 50), superfície controlada.
2. **Tela de disponibilidade** — **entregue** no front (#804, draft): rota
   `/agenda/disponibilidade`, cliente do #801, cache pela resposta do servidor.
3. **Aviso de conflito na `/agenda`** — **entregue** (#197 + #804): `conflicts` vai da app à
   `CalendarAgendaSurface` e ao formulário, que recorta contra o que está nos campos (D23).
4. **Release do DS** — o bot mergeou #187/#195 e abriu o #196 (0.31.0) **sozinho**; o #197 não está
   no escopo dele. Publicação segue humana (D20): nenhuma tag `v0.31.0` existe.

**Execução 20 (bloco) — iCalendar de ponta a ponta.**
*Executada em 2026-11-10 (~15:00–17:30). Três unidades: (A) export `.ics` no backend (#629);
(B) import `.ics` no backend (#629, mesma frente); (C) botão "Baixar .ics" na `/agenda` (#809).
Detalhe no log, execução 20.*

1. **Export** — **entregue** (#629): `GET /calendar/entries/export.ics?from&to[&scope]` com `UID`
   estável, `SEQUENCE` por `updatedAt`, `STATUS:CANCELLED`, `TZID` + `VTIMEZONE` das transições
   reais e folding de 75 octets. 11 testes de serviço.
2. **Import** — **entregue** (#629): `POST /calendar/entries/import` multipart, idempotente por
   `Idempotency-Key` na requisição e por `ICS`+`UID` no banco (D3); aceita `TZID`, UTC e
   `VALUE=DATE`; teto de 512 KB/500 eventos. 7 testes de contrato HTTP.
3. **Tela** — **entregue** (#809): `calendarApi.exportUrl` + download com sessão e botão no
   `PageHeader` da `/agenda`, seguindo a janela e o escopo visíveis.
4. **Fase 6 fechada na mesma rodada:** o **#804 foi mergeado** na `qa` (a tela de disponibilidade
   está no ar) e o release **0.31.0** está publicado — o roadmap ainda dizia "aguardando release".

**Execução 21 (bloco) — fase 4 iniciada, correção da porta de origem e seletor de lembrete na tela.**
*Executada em 2026-11-10 (~18:00–20:30). Três unidades: (A) presença em evento de grupo cria,
reagenda e remove a entrada na agenda; (B) a porta de origem encerra lembrete pendente ao
reagendar/cancelar; (C) seletor de lembrete ligado em `/agenda/$entryId`. Detalhe no log,
execução 21.*

1. **Evento → agenda** — **entregue**: `EventService` grava a entrada do participante pela
   `CalendarSourceService` com origem `EVENT`+`eventId` (D27). `attend` cria, `cancelAttendance`
   remove, `update` move a de todos os participantes, `delete`/`sanitizeExpired` removem de todos.
   O evento não tem hora de fim, então a entrada ocupa uma hora a partir do começo. 5 testes de
   integração.
2. **Lembrete na porta de origem** — **entregue**: `upsert` (quando move) e `cancel` agora chamam
   `clearPendingForEntry`, igual ao caminho direto. Era um buraco real: o aviso do horário antigo
   continuaria agendado. 2 testes novos (12 na suíte de lembretes, 7 na de origem).
3. **Seletor de lembrete na tela** — **entregue**: o #777 mergeou, então a unidade que estava
   esperando revisão humana destravou. O `CalendarEntryDetail` do DS ganhou um slot `reminder`
   (o app não pode escrever markup), e a rota `/agenda/$entryId` busca os lembretes, mostra a
   escolha única e troca de opção apagando as outras — o servidor guarda um por antecedência, e
   duas ligadas avisariam duas vezes por uma escolha só. 3 testes no DS, 4 no front.
4. **Por que não o import na tela:** o contrato do import está no #629, que **mergeou** nesta
   rodada, mas o front teria de reimplementar o parser `.ics`; fica para a próxima, com o
   contrato já estável. A fase 9 (assinatura privada) depende do mesmo serviço `.ics` — adiada
   sem duplicar trabalho.
5. **Regressão completa do backend** — **2335 testes, 1 falha, 1 pulado**. A falha é
   `FeedPaginationTests.trendingKeepsItsWindowAndExcludesPostsOutsideItsExistingScope` (feed,
   fora do escopo). Rodada isolada passa **5/5** na base `enois/qa` sem alterações e **5/5** nesta
   branch, com ~290 s por execução: é flake de tempo sob carga paralela. Registrado no PR #632.
6. **Defasagem corrigida:** a `qa` dizia `EXECUCAO=20` e o **log de execuções estava corrompido**
   — um merge posterior o sobrescreveu com a versão da execução 13, com marcador de conflito
   (`>>>>>>> origin/qa`) no fim, perdendo as execuções 14–20. Este PR restaura o log a partir do
   commit do bloco 20 e acrescenta a execução 21.

**Execução 22 (bloco) — fase 9 entregue: assinatura privada `.ics`.**
*Executada em 2026-11-10 (~22:00–23:20). Três unidades: (A) domínio, migração e persistência da
assinatura; (B) rotas de gestão com sessão e leitura sem sessão com ETag; (C) cliente de API no
front. Detalhe no log, execução 22.*

1. **O token é a credencial, e o banco não a guarda** — **entregue**: V272 com `token_hash` único,
   `scope` congelado (nulo = consolidada, o mesmo contrato da leitura) e `revoked_at`. O token nasce
   com 32 bytes de `SecureRandom` em base64url; a comparação é em tempo constante.
2. **Regenerar gira a mesma linha** — **entregue**: trocar o token não cria assinatura nova, então
   não existe janela com dois links vivos. Revogar marca a data e é idempotente. Criar duas vezes
   devolve a existente **sem** token novo: não há como mostrá-lo de novo, e um segundo link só
   multiplicaria credenciais vivas.
3. **Leitura sem sessão** — **entregue**: `GET /calendar/subscribe/{token}.ics` responde
   `text/calendar` com `ETag` do corpo (304 quando o arquivo não mudou) e `Cache-Control` de 5 min.
   Token desconhecido e token revogado respondem o **mesmo** 404 — distinguir confirmaria que
   aquele link já existiu. Teto por hash do token em `CalendarSubscriptionRateLimitFilter`.
4. **A janela da assinatura é derivada** — 30 dias atrás + 365 à frente estourava o teto de um ano
   do export (`INVALID_WINDOW`, 5 testes vermelhos de primeira). O fim passou a ser `from + 365`.
5. **PRs abertos do bloco 21:** o #632 e o #814 foram **mergeados pelo bot** (`kof-agent-worker`,
   B8) antes da revisão humana. O complemento de regressão virou o #815 (também mergeado pelo bot).
   O lint do DS #203 foi corrigido nesta rodada; o CI do front #813 falha por dependência de
   release do slot `reminder`, registrada no próprio PR.

**Execução 23 (próximo bloco) — proposta.** (1) **Import na tela**: o #629 mergeou, então o
contrato está estável; subir o `.ics` na `/agenda` com o conflito avisado antes de aplicar (D23).
(2) **Tela da assinatura**: o cliente está no #816 e o backend no #637; falta o card no DS para
mostrar o link, copiar e regenerar/revogar. (3) **Fase 4 adiante**: a chamada/vídeo é a próxima
fonte social natural — verificar se há módulo com data/hora legível antes de prometer.
(4) Reconferir os PRs abertos antes de começar (§9).

**O que destravou B6 (2026-11-10, do PR #774).** A tag foi criada como `0.30.0`, **sem o `v`**, e o
workflow do DS só publica em `refs/tags/v*` — nenhum run disparou. Recriada como `v0.30.0` no mesmo
commit (`7d40855`), o publish rodou verde. O lockfile do front foi regerado **pelo registro** (não
escrito à mão) num workflow descartável que commitou o arquivo e foi removido; o #769 saiu do draft
e passou no CI. **Lição para a D20:** o nome da tag importa; antes de anunciar "publicado", conferir
que existe um run disparado pela tag.

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
| 17  | 2026-11-10 ~04:10 | 3/6  | **Bloco de 5 unidades.** (A) #774 absorvido no #778; (B) `CalendarReminderSelector` no DS (#187, 8 testes, 1578 na suíte); (C) cliente de API dos lembretes no front (#786); (D) fase 6: inventário + `CalendarConflictService` e `GET /calendar/entries/conflicts` (#607, 9+4 testes, 78 na regressão, sem migração); (E) cliente de API do conflito, **perdido no merge automático do #786** e reaberto no #792. D23 registrada; #778, #607 e #786 foram mergeados pelo bot `kof-agent-worker` (B8) |
| 18  | 2026-11-10 ~09:30 | 6    | Disponibilidade semanal da agenda no backend (V267, `GET`/`PUT /calendar/availability`, 9+7 testes, 99 de regressão) e o cliente no front (#801, 17/17); aviso de conflito no formulário do DS (#195, 18/18, 1577 na suíte inteira). A V265 que eu tinha escrito colidiu com `user_presence` e virou V267. #792/#791 mergeados pelo bot (B8) |
| 19  | 2026-11-10 ~14:30 | 6    | **Bloco de 3 unidades.** (A) `CalendarAvailability`/`CalendarAvailabilitySurface` no DS com as regras do backend (12+14 testes); (B) `conflicts` repassado pela `CalendarAgendaSurface` (2 testes, 1655 na suíte inteira); (C) tela `/agenda/disponibilidade` e aviso de conflito ligado na `/agenda` no front (7/7, build verde). DS #197 aberto; front #804 em draft até o release. O bot mergeou #187/#195 e abriu o release #196 (B8). Armadilhas: cache do Nitro e `--force-with-lease` com refspec longa |
| 20  | 2026-11-10 ~17:30 | 8    | **Bloco de 3 unidades — fase 8.** (A) export `.ics` no backend (UID estável, VTIMEZONE real, folding 75 octets; 11 testes); (B) import multipart idempotente por ICS+UID (7 testes de contrato) — backend PR #629; (C) `exportUrl` + botão "Baixar .ics" na `/agenda` com a janela da tela (18+3 testes, tsc/build verdes) — front PR #809. Fase 6 confirmada fechada: #804 mergeado e 0.31.0 publicado. D26 registrada |
| 21  | 2026-11-10 ~20:30 | 4/3  | **Bloco de 3 unidades.** (A) presença em evento de grupo cria/reagenda/remove a entrada na agenda (origem `EVENT`, D27; 5 testes); (B) a porta de origem encerra lembrete pendente ao reagendar/cancelar (2 testes, 19 na regressão do módulo); (C) seletor de lembrete ligado em `/agenda/$entryId` com slot novo no DS (3+4 testes, 1659 na suíte do DS). Regressão completa do backend: 2335 testes, 1 falha de feed (passa isolada na base e na branch — flake). #629/#809/#810/#777 mergeados; log da `qa` restaurado (estava corrompido desde a execução 13) |
| 22  | 2026-11-10 ~23:20 | 9    | **Bloco de 3 unidades.** (A) assinatura privada `.ics` no domínio e no banco: V272 com hash único, `scope` congelado e `revoked_at`, token de 32 bytes em base64url, comparação em tempo constante; (B) gestão com sessão e leitura sem sessão com `ETag` e limite por hash do token; 6 de domínio + 9 de contrato, 153 na regressão do módulo e dos filtros; (C) cliente de API no front (22/22, tsc/eslint/build verdes). PRs #637 (backend) e #816 (front); #632/#814/#815 mergeados pelo bot (B8) |
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
