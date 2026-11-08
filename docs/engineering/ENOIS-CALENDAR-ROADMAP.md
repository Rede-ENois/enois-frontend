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
FASE_ATUAL=0 (inventário)
EXECUCAO=1
ULTIMA_ATUALIZACAO=2026-11-08T09:40:00-03:00
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

| Repositório                      | Papel                                     | Branch de entrega          | Estado verificado em 2026-11-08                                           |
| -------------------------------- | ----------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `Rede-ENois/enois-backend`       | API, motor de eventos, migrações, workers | `qa` → `main`              | Base real em `b80e8571`; último migration `V256__call_sessions_event.sql` |
| `Rede-ENois/enois-frontend`      | Telas, navegação, tipos, cliente de API   | `qa` → `main`              | Base em `6610f6e6`                                                        |
| `Rede-ENois/enois-design-system` | Componentes e tokens compartilhados       | publica pacote versionado  | Consumido como `@rede-enois/design-system@0.29.9`                         |
| `Rede-ENois/epapo`               | Sala de reunião (fork do Jitsi)           | `master` (push = produção) | Integração via JWT já existente no módulo `calls`                         |

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

| Funcionalidade                | Frontend                            | Backend                              | Design System                | Situação                                       |
| ----------------------------- | ----------------------------------- | ------------------------------------ | ---------------------------- | ---------------------------------------------- |
| Agenda social                 | não existe                          | não existe                           | não existe                   | **A construir**                                |
| Agenda profissional           | não existe                          | não existe                           | não existe                   | **A construir**                                |
| Visualização consolidada      | não existe                          | não existe                           | não existe                   | **A construir**                                |
| Motor central de compromissos | não existe                          | não existe                           | —                            | **A construir**                                |
| Eventos                       | `/eventos` (vitrine), `eventos.tsx` | `events` (Event + Attendee)          | `event-card`, recorrência    | **Existe parcial** — data/hora são texto livre |
| Mentorias                     | `/mentoria`                         | `mentoring` (`MentorSlot` tipado)    | não existe picker de slot    | **Existe parcial** — sem agenda e sem conflito |
| Entrevistas / vagas           | `/vagas`, candidaturas              | `jobs`                               | —                            | **Não integrado a agenda**                     |
| Chamadas Épapo                | painel de chamada + iframe          | `calls` com `event_id` (V256)        | —                            | **Existe**, sem agendamento                    |
| Salas do Tamo Junto           | barra do encontro                   | `calls` (sala por evento)            | —                            | **Existe**, sem compromisso com hora           |
| Convites / participantes      | parcial em eventos                  | `EventAttendee`                      | não existe status de convite | **A construir central**                        |
| Disponibilidade / conflitos   | não existe                          | slot de mentor isolado               | não existe                   | **A construir**                                |
| Lembretes                     | não existe                          | workers existem, sem lembrete        | não existe                   | **A construir**                                |
| ICS export/import             | não existe                          | não existe                           | não existe                   | **A construir**                                |
| Assinatura privada `.ics`     | não existe                          | não existe                           | não existe                   | **A construir**                                |
| Google/Microsoft/Apple        | não existe                          | OAuth existe no `identity` como base | —                            | **A construir**                                |

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

| Fase | Escopo                                                                   | Depende de   | Estado                           |
| ---- | ------------------------------------------------------------------------ | ------------ | -------------------------------- |
| 0    | Inventário + roadmap + contratos                                         | —            | **em andamento (esta execução)** |
| 1    | Fundação: entidades, migrations, serviço, endpoints, autorização, testes | 0            | pendente                         |
| 2    | Design System: calendário mês/semana/dia/lista, alternância, estados     | 1 (contrato) | pendente                         |
| 3    | Frontend das agendas: navegação, 3 visões, criação, edição, detalhes     | 1, 2         | pendente                         |
| 4    | Agenda social: chamadas, eventos de grupo/comunidade, pessoais           | 3            | pendente                         |
| 5    | Agenda profissional: entrevistas, mentorias, reuniões, workshops         | 3            | pendente                         |
| 6    | Disponibilidade e conflitos                                              | 1            | pendente                         |
| 7    | Épapo e Tamo Junto vinculados a compromisso                              | 1, 4         | pendente                         |
| 8    | iCalendar export/import                                                  | 1            | pendente                         |
| 9    | Assinatura privada e cache                                               | 8            | pendente                         |
| 10   | Provedores externos (Google/Microsoft/Apple)                             | 8, 9         | pendente                         |
| 11   | Revisão geral: regressão, segurança, a11y, performance                   | todas        | pendente                         |

---

## 7. PRs

| PR                                                            | Repositório    | Escopo                                   | Estado                                |
| ------------------------------------------------------------- | -------------- | ---------------------------------------- | ------------------------------------- |
| [#740](https://github.com/Rede-ENois/enois-frontend/pull/740) | enois-frontend | Documentação: roadmap, arquitetura e log | aberto, **aguardando revisão humana** |

Regra: **sem merge automático**. Todo PR fica aguardando revisão humana. Um PR por escopo
delimitado; dependências declaradas no corpo.

---

## 8. Testes executados

Nenhum ainda neste projeto. O gate de cada execução é registrado no log de execução.

---

## 9. Bloqueios e problemas conhecidos

| #   | Problema                                                                             | Impacto                                             | Encaminhamento                                                                   |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| B1  | `enois-backend` local 977 commits atrás da `qa`                                      | leitura de código errada e branch desatualizada     | usar `git show enois/qa:` ou worktree novo; **nunca** commitar no checkout atual |
| B2  | `Event.date`/`time` são texto; front igual                                           | sem consulta por intervalo, sem fuso                | corrigir na Fase 1 com coluna tipada + backfill                                  |
| B3  | Sem `timezone` no domínio                                                            | recorrência e ICS errados                           | decidir na arquitetura (guardar `Instant` + `ZoneId` do organizer)               |
| B4  | `@rede-enois/design-system` é pacote privado e o token local não tem `read:packages` | build/typecheck local falha fora da versão em cache | usar o tarball da versão do lock quando disponível; declarar no PR               |
| B5  | Sem navegador utilizável para prova visual nesta máquina                             | não há captura de tela                              | usar Chrome headless + CDP; quando não der, declarar a limitação no PR           |

---

## 10. Próxima tarefa prioritária

**Execução 2 — Fase 1, primeira unidade:** criar o modelo do compromisso
(`calendar_entries`) com início/fim tipados, `scope`, `kind`, `time_zone_id`, unicidade de
`source_ref` e o índice de consulta por intervalo; migration aditiva numerada a partir de **V257**;
teste de persistência e de consulta por intervalo. Sem endpoint ainda nesta unidade.

---

## 11. Histórico de execuções (resumo)

| #   | Data/hora         | Fase | Resultado                                                                                                                      |
| --- | ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 2026-11-08 ~09:40 | 0    | Inventário dos 4 repositórios, matriz de funcionalidades, dívida de data/hora, roadmap e arquitetura escritos; docs no PR #740 |
