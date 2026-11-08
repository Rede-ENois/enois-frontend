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
FASE_ATUAL=1 (fundação do calendário)
EXECUCAO=2
ULTIMA_ATUALIZACAO=2026-11-08T13:10:00-03:00
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

| Repositório | Papel | Branch de entrega | Estado verificado em 2026-11-08 |
|---|---|---|---|
| `Rede-ENois/enois-backend` | API, motor de eventos, migrações, workers | `qa` → `main` | Base real em `b80e8571`; último migration `V256__call_sessions_event.sql` |
| `Rede-ENois/enois-frontend` | Telas, navegação, tipos, cliente de API | `qa` → `main` | Base em `6610f6e6` |
| `Rede-ENois/enois-design-system` | Componentes e tokens compartilhados | publica pacote versionado | Consumido como `@rede-enois/design-system@0.29.9` |
| `Rede-ENois/epapo` | Sala de reunião (fork do Jitsi) | `master` (push = produção) | Integração via JWT já existente no módulo `calls` |

**Atenção operacional:** o clone local `/home/mel/Documentos/rede` está **977 commits atrás** da
`qa` real. Toda leitura de código do backend deve ser feita por
`git show enois/qa:<caminho>` ou num worktree novo a partir de `origin/qa`. Não trabalhar no
checkout atual.

---

## 3. Arquitetura identificada

### Backend (`com.socialcoisa.rede`, 41 pacotes, arquitetura hexagonal por módulo)

Cada módulo segue `domain/` + `application/` (+ `application/port/in`, `port/out`) + `adapters/in/web`
+ `adapters/out/persistence`. Um `*Module.java` faz a fiação. A base tem um pacote `apiv1` que
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

| Funcionalidade | Frontend | Backend | Design System | Situação |
|---|---|---|---|---|
| Agenda social | não existe | não existe | não existe | **A construir** |
| Agenda profissional | não existe | não existe | não existe | **A construir** |
| Visualização consolidada | não existe | não existe | não existe | **A construir** |
| Motor central de compromissos | não existe | não existe | — | **A construir** |
| Eventos | `/eventos` (vitrine), `eventos.tsx` | `events` (Event + Attendee) | `event-card`, recorrência | **Existe parcial** — data/hora são texto livre |
| Mentorias | `/mentoria` | `mentoring` (`MentorSlot` tipado) | não existe picker de slot | **Existe parcial** — sem agenda e sem conflito |
| Entrevistas / vagas | `/vagas`, candidaturas | `jobs` | — | **Não integrado a agenda** |
| Chamadas Épapo | painel de chamada + iframe | `calls` com `event_id` (V256) | — | **Existe**, sem agendamento |
| Salas do Tamo Junto | barra do encontro | `calls` (sala por evento) | — | **Existe**, sem compromisso com hora |
| Convites / participantes | parcial em eventos | `EventAttendee` | não existe status de convite | **A construir central** |
| Disponibilidade / conflitos | não existe | slot de mentor isolado | não existe | **A construir** |
| Lembretes | não existe | workers existem, sem lembrete | não existe | **A construir** |
| ICS export/import | não existe | não existe | não existe | **A construir** |
| Assinatura privada `.ics` | não existe | não existe | não existe | **A construir** |
| Google/Microsoft/Apple | não existe | OAuth existe no `identity` como base | — | **A construir** |

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

| Fase | Escopo | Depende de | Estado |
|---|---|---|---|
| 0 | Inventário + roadmap + contratos | — | **concluída** |
| 1 | Fundação: entidades, migrations, serviço, endpoints, autorização, testes | 0 | **em andamento** (modelo + persistência entregues) |
| 2 | Design System: calendário mês/semana/dia/lista, alternância, estados | 1 (contrato) | pendente |
| 3 | Frontend das agendas: navegação, 3 visões, criação, edição, detalhes | 1, 2 | pendente |
| 4 | Agenda social: chamadas, eventos de grupo/comunidade, pessoais | 3 | pendente |
| 5 | Agenda profissional: entrevistas, mentorias, reuniões, workshops | 3 | pendente |
| 6 | Disponibilidade e conflitos | 1 | pendente |
| 7 | Épapo e Tamo Junto vinculados a compromisso | 1, 4 | pendente |
| 8 | iCalendar export/import | 1 | pendente |
| 9 | Assinatura privada e cache | 8 | pendente |
| 10 | Provedores externos (Google/Microsoft/Apple) | 8, 9 | pendente |
| 11 | Revisão geral: regressão, segurança, a11y, performance | todas | pendente |

---

## 7. PRs

| PR | Repositório | Escopo | Estado |
|---|---|---|---|
| [#740](https://github.com/Rede-ENois/enois-frontend/pull/740) | enois-frontend | Documentação: roadmap, arquitetura e log | aberto, **aguardando revisão humana** |
| [#531](https://github.com/Rede-ENois/enois-backend/pull/531) | enois-backend | Fase 1: modelo `calendar_entries` (V257) + persistência e consulta por janela | aberto, **aguardando revisão humana** |

Regra: **sem merge automático**. Todo PR fica aguardando revisão humana. Um PR por escopo
delimitado; dependências declaradas no corpo.

---

## 8. Testes executados

Última execução (backend, `feat/enois-calendar`), `./mvnw -o test`:

| Classe | Testes | Resultado |
|---|---|---|
| `CalendarEntryTests` | 8 | verde |
| `CalendarEntryPersistenceTests` | 5 | verde |
| `MariaDbReservedWordsTests` | 2 | verde (guarda de migration) |
| `FlywayMigrationConfigTests` | 5 | verde (inclui unicidade de versão) |

O gate de cada execução fica registrado no log de execução.

---

## 9. Bloqueios e problemas conhecidos

| # | Problema | Impacto | Encaminhamento |
|---|---|---|---|
| B1 | `enois-backend` local 977 commits atrás da `qa` | leitura de código errada e branch desatualizada | usar `git show enois/qa:` ou worktree novo; **nunca** commitar no checkout atual |
| B2 | `Event.date`/`time` são texto; front igual | sem consulta por intervalo, sem fuso | corrigir na Fase 1 com coluna tipada + backfill |
| B3 | Sem `timezone` no domínio | recorrência e ICS errados | decidir na arquitetura (guardar `Instant` + `ZoneId` do organizer) |
| B4 | `@rede-enois/design-system` é pacote privado e o token local não tem `read:packages` | build/typecheck local falha fora da versão em cache | usar o tarball da versão do lock quando disponível; declarar no PR |
| B5 | Sem navegador utilizável para prova visual nesta máquina | não há captura de tela | usar Chrome headless + CDP; quando não der, declarar a limitação no PR |

---

## 10. Próxima tarefa prioritária

**Execução 3 — Fase 1, segunda unidade:** serviço de aplicação e endpoints de leitura da agenda
(`GET /calendar/entries?from=&to=&scope=` e `GET /calendar/entries/{id}`), com autorização por dono
(quem não é dono não vê a entrada) e DTO de saída que não expõe a entidade. Teste de contrato
cobrindo 401 sem sessão, 404 para entrada alheia e o filtro de agenda. Sem criação/edição ainda.

---

## 11. Histórico de execuções (resumo)

| # | Data/hora | Fase | Resultado |
|---|---|---|---|
| 1 | 2026-11-08 ~09:40 | 0 | Inventário dos 4 repositórios, matriz de funcionalidades, dívida de data/hora, roadmap e arquitetura escritos; docs no PR #740 |
| 2 | 2026-11-08 ~13:10 | 1 | `calendar_entries` (V257) + domínio + porta/adaptador + 20 testes verdes; backend PR #531 |

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
