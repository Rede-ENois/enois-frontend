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

---

## D11 — Escrita da agenda: `Idempotency-Key`, 400 com código e 404 em vez de 403

**Problema.** Criar, editar e cancelar compromisso pelo app significa um botão que a pessoa pode
apertar duas vezes: o toque duplo, o retry depois de um timeout, a rede que caiu mas a requisição
chegou. Sem idempotência isso vira dois compromissos ou um cancelamento com carimbo trocado.

**Decisão.**

- `POST /calendar/entries`, `PATCH /calendar/entries/{entryId}` e `DELETE /calendar/entries/{entryId}`
  passam pelo `IdempotencyApplicationService` do repositório, com chave = método + rota +
  `Idempotency-Key` + hash do corpo. Sem `Idempotency-Key` a resposta é 400
  `IDEMPOTENCY_KEY_REQUIRED`; a mesma chave com corpo diferente é 409 `IDEMPOTENCY_PAYLOAD_CONFLICT`.
- O intervalo no `PATCH` vai em par: `startsAt` e `endsAt` juntos, e trocar o fuso exige os dois.
  Meio intervalo novo não tem significado, e aceitar só o início faria o compromisso esticar ou
  encolher sem quem editou perceber.
- `description` em branco limpa o texto. No JSON é a única forma de dizer "tirar a descrição" que
  não se confunde com "não mexi nesse campo"; campo ausente continua significando "não muda".
- `DELETE` **cancela**: a linha fica, com `state=CANCELLED` e `cancelledAt`. Cancelar de novo devolve
  200 com o mesmo carimbo (o botão repetido não é erro). Editar entrada cancelada é 409
  `CALENDAR_ENTRY_CANCELLED` — o registro só existe para publicar o cancelamento no `.ics`.
- Violação de invariante do domínio sai como **400 `INVALID_CALENDAR_ENTRY`** com a mensagem do
  domínio, que já explica a regra (fim antes do início, fuso desconhecido, texto acima do teto). O
  controller não reescreve a mensagem: a causa muda, o código não.
- Entrada de outra pessoa devolve o mesmo **404 `CALENDAR_ENTRY_NOT_FOUND`** de um id inexistente,
  pela razão de D10: 403 confirmaria que o id existe.

**Rejeitado.** PUT de corpo completo na edição: a tela de detalhe edita um campo por vez, e um PUT
obrigaria o cliente a reenviar o que não mudou (e a perder a edição de outra pessoa entre a leitura
e o envio). Flag `deleted=true` no corpo em vez de `DELETE`: a rota de cancelamento precisa existir
de qualquer forma, e um `DELETE` que não apaga precisa ser dito no nome da rota e na doc, não
escondido num corpo.

**Limite conhecido.** A idempotência cobre 24 h (TTL do serviço). Depois disso a mesma chave cria
outra entrada. Para repetição de clique e retry isso é mais do que suficiente; para sincronização
externa existe a origem (`source_type`/`source_id`), que é outra garantia (D3).

---

## D12 — O compromisso criado pela rota de agenda não tem origem

**Problema.** A entrada tem origem (`source_type`/`source_id`) para o módulo dono saber se já gravou
o compromisso. Usar a rota de escrita do app para gravar evento ou mentoria exigiria a origem no
corpo, e aí qualquer pessoa poderia dizer "esta entrada é o evento X" sem ser dona do evento.

**Decisão.** A rota `POST /calendar/entries` cria sempre com origem vazia: é compromisso do próprio
calendário. Módulo que grava entrada de outro tipo (evento, mentoria, vaga, chamada) usa o serviço de
aplicação, com a origem preenchida, depois de validar a própria regra. A origem não é aceita no corpo
da rota pública de escrita.

**Consequência.** A Fase 4 e a Fase 5 (agendas social e profissional) escrevem pelo serviço, não por
HTTP, e a rota HTTP nunca precisa confiar num `sourceId` vindo do cliente.

---

## D13 — O convite é do compromisso, e a agenda de cada um é a união de duas consultas

**Problema.** Compromisso social quase nunca é de uma pessoa só. O organizador precisa ver quem
aceitou; o convidado precisa ver o compromisso na própria agenda com a própria resposta, sem passar
a ser dono da entrada.

**Decisão.**

- Tabela própria (`calendar_entry_participants`) com estado por pessoa, em vez de coluna na entrada:
  cada participante responde por si, e um aceito com dois recusados não cabe numa coluna.
  Unicidade `(entry_id, user_id)` impede o convite repetido no banco, não só na checagem.
- `INVITED` é pendente, não resposta. `TENTATIVE` ("talvez") é resposta de verdade e fica separada
  de `ACCEPTED`: somar talvez como presença faz o organizador contar quem não confirmou.
- A leitura da agenda consulta os compromissos do dono e os compromissos em que a pessoa foi
  convidada, e devolve cada item com `owner` e `participation`. A tela não precisa de duas rotas
  nem de juntar listas no cliente.
- **Convite recusado continua na agenda.** A pessoa respondeu, o compromisso faz parte do histórico
  dela. Filtrar "só o que eu vou" é da tela, pelo campo `participation`.
- O organizador não tem linha de participante. Convite para o próprio dono é 400.
- Quem responde é tirado da sessão (`/participants/me`), não do caminho. Rota com id de pessoa
  deixaria alguém responder convite alheio bastando o id, e a checagem viraria outra regra de dono.
- Convite para entrada cancelada é 409: a entrada cancelada existe para publicar o cancelamento, não
  para receber gente nova.

**Rejeitado.** Tabela de "convite" separada de "participante": o ciclo de vida é o mesmo e duas
tabelas criariam o estado em que a pessoa está convidada e não participante ao mesmo tempo. Estado
do convite dentro do item do compromisso (JSON na entrada): não dá para consultar "quem aceitou" sem
ler e reescrever o compromisso inteiro.

**Limite conhecido.** Convidar 50 pessoas numa transação grava 50 linhas uma a uma. Para o tamanho
de uma agenda social isso está certo; se aparecer compromisso de comunidade com centenas de
convidados, o caminho é o lote, como o chat fez em `#535`.

---

## D14 — Convidado vê o compromisso, não ganha a entrada

**Problema.** Depois que a pessoa aceita o convite, a tentação é copiar o compromisso para a agenda
dela. Aí existem duas linhas para o mesmo evento, e o reagendamento do organizador atualiza uma e
deixa a outra para trás.

**Decisão.** O convidado lê o mesmo compromisso do organizador, com `owner=false`. As rotas de
escrita continuam restritas ao dono e respondem 404 para o convidado, exatamente como respondiam
antes de existir convite. O que o convidado muda é a própria resposta, por `/participants/me`.

**Consequência.** O convidado não tem como mudar horário, título ou cancelar: quem organiza é que
reagenda, e quem foi convidado responde de novo se mudou de ideia. Unificar essas regras no item
compartilhado exigiria permissão por campo, que é complexidade sem caso de produto hoje.

---

## D15 — O detalhe é o item da agenda, e convite pendente é consulta própria

**Problema.** A leitura em lista já devolvia `{ entry, owner, participation }`, mas o detalhe
devolvia só a entrada. A tela de detalhe teria de descobrir sozinha se o compromisso é do leitor ou
um convite, e o convidado precisaria saber o próprio estado por outro caminho. Além disso, mostrar
"você foi convidado" exigiria varrer a agenda inteira em toda abertura do app.

**Decisão.** O detalhe (`GET /calendar/entries/{entryId}`) devolve `{ entry, owner, participation,
participants }`, o mesmo vocabulário do item da agenda. `participants` só vem preenchido para o
organizador; para o convidado ele é `null`. E entra `GET /calendar/invitations`, com os convites em
`INVITED` de entrada ativa, do mais antigo ao mais novo.

**Consequência.**

- A tela tem uma forma só para lista e detalhe: a diferença é `participants`, não outro contrato.
- O convidado não vê a lista de convidados de um compromisso da agenda de outra pessoa. A lista é
  informação do organizador; expor para todo convidado permite montar o grafo social de alguém.
  Se a Fase 4 precisar mostrar "quem mais vai" em evento de comunidade, isso é decisão de produto
  sobre um compromisso público, não sobre agenda privada, e vira campo explícito.
- `participants` nulo em vez de lista vazia: lista vazia significa "ninguém convidado", que é
  informação diferente de "não é seu para ver". O front testa nulo para esconder a seção.
- Convite pendente é a linha em `INVITED`; responder (aceitar, recusar, talvez) tira da lista. Entrada
  cancelada sai da lista mesmo com o convite em `INVITED`, porque não há mais o que responder.
- A consulta é por pessoa e por estado, com índice `(user_id, state)`, não uma varredura da agenda
  em janela de tempo: o convite pendente pode ser de um compromisso do mês que vem.

**Rejeitado.** `?state=` como filtro na rota de convites: o único estado que interessa para "o que eu
preciso responder" é `INVITED`, e responder já muda o estado. Um parâmetro livre convidaria a
inventar listas de "meus recusados", que é a agenda com `participation=DECLINED`. Rejeitado também
devolver os participantes para o convidado: não há caso de produto hoje que precise disso.

---

## D16 — A agenda mora na seção "explore" do menu, e aparece sempre

**Problema.** O menu principal é feito de seções (`you`, `community`, `work`, `explore`), e as
entradas de `community` e `work` dependem de módulo. A agenda não é de um módulo: a mesma tela serve
a vida social e a profissional, e a pessoa pode ter as duas, uma ou nenhuma. Se a entrada ficar
dentro de `work`, ela desaparece para quem só usa a rede socialmente; se nascer com módulo, a
pendência de módulo do dia pode esconder a tela por um motivo que não existe.

**Decisão.** A entrada da agenda fica na seção `explore`, com `section: "explore"` e `module: null`,
sempre visível. Ela não é filtrada por módulo, permissão de módulo nem por plano de assinatura.

**Consequência.**

- Quem está logado sempre tem um caminho até a agenda, mesmo que não use nenhum dos módulos que hoje
  ocupam o menu.
- A seção `explore` é o lugar das telas que não pertencem a um módulo; a agenda é a primeira entrada
  fixa ali e serve de referência para as próximas do mesmo tipo.
- A tela da agenda (fase 3) não precisa de guarda de módulo no front: a única guarda é a sessão.
  O backend já responde 401 sem sessão e nunca devolve compromisso de outra pessoa (D10), então a
  visibilidade no menu não abre nada que a API não fechasse.
- O DS não decide onde a rota mora; ele expõe a tela. A posição no menu é do app, que monta a lista
  de `NavigationItemData` com o `CalendarAgenda` na rota. A unidade do DS que fecha este assunto é a
  entrada de menu com a seção certa e o teste que prova que ela aparece sem módulo.

**Rejeitado.** Criar um módulo "agenda" só para dar lugar ao menu: a agenda não tem tela de
administração, não tem permissão própria e não deve poder ser desligada por módulo. Rejeitado também
colocar a entrada duplicada em `you` e `work`: duas entradas iguais confundem e uma delas ficaria
escondida no mesmo menu.
