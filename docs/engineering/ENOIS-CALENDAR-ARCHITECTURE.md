# Énóis Calendar — Decisões arquiteturais

> Registro de decisões, uma por seção, com o problema, as alternativas e o porquê.
> Uma decisão só entra aqui depois de tomada; proposta em aberto fica marcada como **proposta**.

---

## D1 — Compromisso como entidade central, com `sourceRef` (proposta, Fase 1)

**Problema.** Hoje cada funcionalidade tem seu próprio horário: `events` tem `date`/`time` texto
livre, `mentoring` tem `MentorSlot` com `Instant`, e `calls` tem sala mas não tem hora. Sem uma
entidade central, cada módulo novo inventaria seu horário de novo, e nada aparece numa agenda.

**Decisão.** Uma tabela `calendar_entries` é a fonte temporal única. Todo compromisso é uma linha
dela, com `scope` (`SOCIAL` ou `PROFESSIONAL`) e `kind` (`PERSONAL`, `EVENT`, `MENTORING`,
`INTERVIEW`, `MEETING`, `CALL`, `WORKSHOP`). A origem guarda `source_type` + `source_id`, com
índice único, para que um reagendamento de mentoria **atualize** a entrada em vez de duplicar.

**O que foi rejeitado.** Uma tabela por tipo de compromisso. Funciona até a primeira consulta de
intervalo que precisa juntar tipos (a visualização consolidada, que é requisito), e aí vira UNION em
cinco tabelas com regras de permissão diferentes.

**Risco aceito.** Um modelo central tende a virar genérico demais. A mitigação é o `kind` não carregar
regra: a validação de um entrevista (candidato, entrevistadores, processo) fica no módulo de
entrevistas, que grava a entrada com `source_type=INTERVIEW`. A tabela central sabe **quando**, não
**o que é**.

---

## D2 — Guardar `Instant` + `ZoneId`, nunca só horário local (proposta, Fase 1)

**Problema.** `Event.date` e `Event.time` são `String`. O parser de `Event.expiresAt()`
(`events/domain/Event.java:44`) assume UTC quando converte, e a recorrência nunca vai funcionar por
cima de texto.

**Decisão.** `starts_at`/`ends_at` como `Instant` (timestamptz) mais `time_zone_id` (o fuso do
organizador no momento da criação). O fuso existe porque uma reunião recorrente "toda terça às 19h"
tem que continuar às 19h depois do horário de verão, e um `Instant` sozinho não lembra a regra.

**O que fica para depois.** A conversão das linhas antigas de `events` entra como migration de
backfill separada, com relatório do que não converteu em vez de chutar fuso.

---

## D3 — Idempotência por `source_ref`, não por nome (Fase 1)

Criar a entrada de uma mentoria duas vezes por clique duplo ou por retry do cliente não pode gerar
dois compromissos. O índice único em (`source_type`, `source_id`) faz o banco recusar o duplicado,
e o serviço trata o conflito como sucesso idempotente.

**Ajuste de implementação (V257).** `source_type` e `source_id` são nulos nas entradas que nascem no
próprio calendário (compromisso pessoal), e nulo em índice único não colide no MySQL/MariaDB, então
as duas linhas nulas podem coexistir. A única origem que sem índice único gera duplicata é a
sincronização externa, e essa nasce na Fase 10, com `source_type` preenchido desde a primeira linha.

**Invariante na tabela.** `(source_type, source_id)` são nulos **juntos** ou preenchidos **juntos**
(`CHECK`). Uma entrada com tipo e sem id não teria como ser relida, e uma com id e sem tipo confunde
dois módulos que usem o mesmo id.

---

## D4 — Lembretes por worker com `attempts`, não por fila de mensagens (proposta, Fase 1/6)

**Problema.** O pedido exige lembrete de 5 min a 1 dia antes, sem duplicata e com falha tratada.

**Decisão.** Reaproveitar o padrão já provado no repositório:
`ScheduledPostPublishWorker` + `publishDue()` (`feed/application/ScheduledPostService.java:144`).
Uma tabela de lembrete com `due_at`, `attempts` e `sent_at`, um worker de 30 s que pega o que venceu
com limite por ciclo, e o envio via `NotificationService` dentro do outbox existente.

**O que foi rejeitado.** Delay queue em broker. O repositório não tem broker hoje, e um worker com
`attempts` cobre o volume de agenda sem infraestrutura nova.

**Por que não `@Scheduled` por lembrete.** Agendar dinamicamente um `Runnable` por compromisso
perde o lembrete quando o processo reinicia, e é exatamente o caso que a biblioteca de agenda
externa vai exercitar (assinatura atualiza, container recicla).

---

## D5 — Isolamento entre as duas agendas é no serviço, não só na consulta (proposta, Fase 1)

A agenda consolidada lê as duas, mas o compromisso privado de uma **não** pode vazar detalhe para a
outra. A regra: o `CalendarQueryService` resolve o conjunto de entradas visíveis por
(usuário, agenda, papel) e o DTO de saída é montado depois desse filtro. Compromisso privado que
aparece na consolidada entra como **bloco ocupado** (início, fim, sem título) — nunca com título,
descrição ou participantes.

Não confiar no `scope` que o cliente manda: o `scope` de uma entrada criada por outro módulo vem do
módulo, não do corpo da requisição.

---

## D6 — iCalendar gerado no servidor a partir da entrada central (proposta, Fase 8)

Exportar `.ics` é função da entrada central, não de cada módulo. Um `Event` gera um `VEVENT` com
`UID` estável derivado de (`source_type`, `source_id`), `SEQUENCE` crescente a cada alteração, e
`STATUS:CANCELLED` no cancelamento em vez de sumir do arquivo (é assim que o leitor externo remove o
evento).

`VALARM` cobre os lembretes do próprio calendário externo; os nossos continuam sendo nosso worker.

Fuso na exportação vai como `TZID` explícito com `VTIMEZONE`, não como UTC achatado, senão a
recorrência quebra no cliente.

---

## D7 — Assinatura privada com token, somente leitura (proposta, Fase 9)

`/api/v1/calendar/subscribe/{token}.ics` responde sem sessão, mas o token é o segredo: gerado com
`SecureRandom`, guardado como hash, revogável e regenerável. Resposta `Cache-Control` curto com
`ETag` derivado da versão da agenda, para o cliente não baixar a agenda inteira a cada ciclo.
Rate limit por token para não virar alvo de força bruta nem de DoS.

**Não** usar o `id` do usuário na URL, nunca. O token é a única credencial do link.

---

## D8 — Design System primeiro, sem biblioteca nova (proposta, Fase 2)

As visões de mês/semana/dia são construídas com os componentes já existentes (`dialog`, `popover`,
`tabs`, `pill`, `empty-state`, `skeleton`). A recorrência reusa
`design-system/domain/events/recurrence` em vez de criar uma segunda regra de RRULE.

Não introduzir biblioteca de calendário sem necessidade comprovada: as três visões são aritmética de
data e grade, e a dependência externa traria o próprio CSS e o próprio tema, que brigariam com os 60
temas do app.

---

## D9 — A execução horária é uma sessão de agente com o repositório como memória

**Problema.** O projeto pede uma execução por hora que continue de onde a anterior parou. Uma
automação agendada não nasce com o histórico da conversa anterior: o que ela tem é o workspace.

**Decisão.** O estado entre execuções fica em três arquivos versionados em `docs/engineering/`:
o roadmap (estado, fases, bloqueios, próxima tarefa), a arquitetura (decisões) e o log (o que cada
execução entregou). Cada execução atualiza os três no fim, e são a primeira leitura da seguinte.

**Consequência prática.** Perder a lista de tarefas de uma sessão não perde trabalho, porque a lista
real está no roadmap. Bloqueio (credencial OAuth, acesso, pacote privado) fica escrito com o
encaminhamento em vez de ser redescoberto a cada hora.

---

## D10 — Cancelado aparece na leitura, e entrada alheia é indistinguível de inexistente

**Problema.** A linha cancelada continua na tabela (D6 depende disso para o `.ics`). Se a consulta a
escondesse, a tela não conseguiria mostrar "desmarcado" e o arquivo exportado divergiria do que a
leitura diz. E a leitura por identificador precisa decidir o que responder para entrada de outra
pessoa.

**Decisão.** `GET /calendar/entries` devolve o cancelado na janela com `state=CANCELLED` e
`cancelledAt`; quem não quer mostrar filtra na tela, mas a API não esconde o fato. O detalhe de
entrada alheia responde o mesmo `404 CALENDAR_ENTRY_NOT_FOUND` de um id que não existe: um 403
confirmaria que aquela agenda tem um compromisso naquele identificador.

**O que foi rejeitado.** Filtrar `ACTIVE` na consulta e criar um parâmetro para "incluir cancelado".
Seria estado escondido por padrão, e a primeira tela que esquecesse o parâmetro mostraria uma agenda
que não bate com a exportação.

**Limite conhecido.** A checagem de dono do detalhe acontece depois de carregar a linha. O custo é uma
linha lida a mais por tentativa; a consulta da janela já filtra por dono no banco, então a lista nunca
lê agenda alheia.
