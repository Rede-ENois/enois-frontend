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

---

## D17 — O formulário escreve relógio de parede, e o instante nasce uma vez, no salvar

**Contexto.** A API guarda `Instant` e o `ZoneId` do organizador (D2). A pessoa escreve "19h no dia
10". Entre os dois existe uma conversão, e ela é a fonte clássica de erro de agenda: um horário salvo
com o fuso do navegador vira outro horário para quem lê de outro lugar, e as duas horas por ano em
que o relógio muda não têm uma resposta óbvia.

**Decisão.** O rascunho do formulário guarda **relógio de parede**: dia `YYYY-MM-DD` mais `HH:mm`,
na zona da entrada, nunca um instante. A conversão para instante acontece uma vez, em `instantOf`,
no momento de salvar, e a leitura faz o caminho de volta com `wallClockOf`.

Regras da conversão, fixadas em teste:

- Hora repetida no fim do horário de verão: o instante mais cedo dos dois. É o que a pessoa quer
  dizer ao escrever 01:30 num dia em que 01:30 acontece duas vezes.
- Hora que não existe no começo do horário de verão: cai na próxima hora válida da zona. O relógio
  pedido não é um horário que exista, e o resultado é o primeiro instante que a zona usa depois do
  salto.

**Consequência.**

- "19h" continua sendo 19h para quem escreveu, mesmo que a pessoa mude de país e leia a agenda de
  outro fuso: o instante é o mesmo e o rótulo é derivado da zona da entrada.
- O componente não precisa saber em que fuso a máquina está. O `Intl.DateTimeFormat` é sempre
  chamado com `timeZone` explícito, nunca com o fuso do ambiente.
- Os campos de horário não carregam data. Por isso um compromisso que passa da meia-noite se escreve
  movendo o dia, e o rascunho aberto às 23h30 já nasce no dia seguinte: manter a data de hoje com
  começo 00:00 abriria um compromisso que já passou.
- Os tetos de validação são os da API, num só lugar (`calendar-entry-draft`), e a mensagem recebe o
  número em vez de repeti-lo: um teto que muda no servidor muda a frase sem editar dois arquivos.
- O diálogo não busca dado, não navega e não salva. A chave de idempotência (D11), a mutação e o erro
  do servidor são do app, que devolve o erro pronto para o diálogo mostrar sem apagar o que a pessoa
  digitou.

**Rejeitado.** Guardar um instante no rascunho e converter ao editar: a edição de uma entrada que
caiu numa hora repetida perderia a escolha original, e o formulário passaria a depender do fuso do
navegador para exibir o horário. Rejeitado também deixar o navegador calcular o horário local
(`toLocaleString` sem `timeZone`): seria o mesmo defeito de data sem fuso que o app já corrigiu em 45
pontos.

## D18 — A superfície guarda a entrada do formulário; o app guarda o resto

**Contexto.** Até aqui o DS tinha as visões (`CalendarAgenda`) e o formulário
(`CalendarEntryFormDialog`) separados, e cada tela ligaria os dois à mão: guardar qual entrada está
em edição, abrir o diálogo certo, fechar quando salva. Três telas (social, profissional e
consolidada) repetiriam esse fio, e é nele que mora o erro que o leitor mais percebe: o diálogo
fechando antes de o servidor responder, ou abrindo de novo com o que ele já tinha descartado.

**Decisão.** Um componente do DS, `CalendarAgendaSurface`, compõe a agenda com o formulário e é dono
de **uma** coisa: qual entrada está no formulário (`{ kind: "new" }` ou `{ kind: "edit", entry }`).

- O app continua dono da consulta, do período, da visualização, da chave de idempotência e da
  mutação. A superfície não busca dado, não navega e não chama API.
- `onSave(values, entry)` devolve `Promise<boolean>`, com `entry` nulo ao criar e a entrada ao
  editar. O diálogo fecha **só** no `true`; no `false` os campos digitados e o `saveError` continuam
  na tela. Fechar por otimismo e reabrir com erro é o que apaga o que a pessoa escreveu.
- A entrada que o app manda editar ganha do rascunho local. Ao abrir um compromisso novo, a
  superfície chama `onEditingChange(null)` para o app limpar a seleção; sem isso a entrada volta a
  abrir no render seguinte e a pessoa não consegue criar.
- Um compromisso novo nasce no dia que está na tela: o dia escolhido na grade do mês quando existe,
  senão o período. Salvar em "hoje" com o leitor olhando outro mês é o defeito óbvio.
- `CalendarAgenda` ganhou `newEntryLabel` e `onNewEntry` opcionais. Sem eles o componente desenha
  exatamente o que desenhava, então quem já usa a agenda não muda nada.

**Consequência.**

- As três telas da Fase 3 viram consulta e mutação, sem repetir o estado do diálogo. Uma correção no
  ciclo de salvar vale para as três.
- O padrão é o mesmo de `ProjectsManager` no DS: o app diz qual item está em edição, o DS desenha e
  devolve o resultado. Nada de estado duplicado.
- O teste do ciclo de salvar fica no DS, com app de mentira que devolve `true`/`false`. O teste da
  tela, na Fase 3, só prova que a mutação certa foi chamada e que a janela recarregou.

**Rejeitado.** Deixar o diálogo fechar sozinho no submit e o app avisar o erro depois: perde o que
foi digitado e faz o erro aparecer sobre uma tela que já voltou. Rejeitado também guardar o rascunho
do formulário no app (o estado do campo subiria para três telas e cada uma teria uma cópia da regra
de quando fechar).

## D19 — Entrada com origem tem dono, chave e ciclo de vida próprios (decisão, Fase 1)

**Contexto.** A D3 prometeu idempotência por origem (`source_ref`), mas a V257 criou só um índice
comum em (`source_type`, `source_id`) e `findBySource` não tinha chamador de produção: nenhum módulo
escrevia na agenda central a partir de uma origem. Sem isso, marcar a mesma sessão de mentoria duas
vezes criaria duas entradas, e cancelar deixaria a entrada viva na agenda.

**Decisão.** A escrita de uma entrada com origem passa por um serviço único, `CalendarSourceService`,
e a chave da idempotência é (`owner_id`, `source_type`, `source_id`).

- **O dono faz parte da chave.** Dois donos podem ter entrada para a mesma origem ao mesmo tempo (o
  mentorado e o mentor veem a mesma reunião, cada um na própria agenda). O índice único é por dono, e
  um teste prova que a segunda pessoa consegue gravar a própria linha.
- **Upsert, não insert.** Se já existe linha ativa para a origem, o serviço reagenda, renomeia e
  reescreve a descrição na mesma linha e devolve `moved=true` quando a janela mudou. Reagendar a
  sessão move a entrada, não cria uma segunda.
- **Cancelado não volta.** Se a linha existe cancelada, um upsert posterior da origem não a revive. O
  cancelamento é estado (`CANCELLED`), não remoção, coerente com a D10. Quem cancela mantém o
  histórico.
- **A origem nunca entra pelo HTTP público.** Vale a D12: o corpo da rota de agenda não aceita
  origem. O `CalendarSourceService` é chamado pelo serviço de aplicação do módulo dono (aqui, o de
  mentoria), que é quem conhece a origem de verdade.
- **O fuso da origem tem padrão.** Sem `timeZoneId` explícito o serviço usa o fuso padrão do módulo
  de agenda, não o fuso do processo do servidor. Um instant sozinho não diz o relógio de parede que a
  pessoa marcou.

**Consequência.**

- Todo módulo que quiser aparecer na agenda central passa por `CalendarSourceService.upsert` com uma
  origem estável (aqui, `MENTORING` + id da sessão). Nenhum módulo escreve `calendar_entries` direto.
- A entrada da mentoria é do mentorado (`owner = menteeId`), porque é ele quem tem a reunião na
  própria agenda. O mentor não recebe cópia nesta rodada; se passar a receber, será outra origem, com
  a própria chave.
- Trocar o índice comum pelo único na V260 é compatível com o que já está gravado: só existia linha
  de agenda sem origem até agora, então o índice é criado sobre zero duplicatas.

**Rejeitado.** Chave só com (`source_type`, `source_id`), sem o dono: impediria duas pessoas de terem
a mesma reunião na própria agenda. Rejeitado também permitir que o upsert revivesse uma entrada
cancelada: reintroduziria na agenda algo que a pessoa tirou.

---

## D20 — O pacote do DS só existe quando a mantenedora empurra a tag (execução 12)

**Contexto.** A fase 2 entregou o calendário no código do Design System (#164/#165/#166), mas o
projeto continuou parado porque a tela não podia importá-lo. O inventário da execução 12 mostra por
quê, e não é o que o roadmap supunha: **nenhuma versão publicada tem o módulo**. A tag
`v0.29.10-rc.1` — a mais recente, e a que o front fixa — aponta para `7c0d17e`, 24 commits antes dos
merges do calendário. Mergear no `main` do DS não publica nada: o workflow só publica quando recebe
uma tag `v*`.

**Decisão.** O release se resolve pelo caminho que o repositório já tem, sem atalho:

1. PR `chore(release): X.Y.Z` a partir do `main`, mudando só a versão em `package.json` e no
   lockfile (3 linhas, como todos os releases anteriores).
2. Merge e **push da tag** pela mantenedora — o CONTRIBUTING é explícito: "Releasing is a maintainer
   action. Agents prepare, they do not publish... Never push tags, edit the publish workflow or
   publish by hand."
3. O front sobe o pin e usa o pacote publicado.

**Consequência.**

- O agente prepara, testa e documenta o release; a publicação é humana. Isso não é limitação do
  agente, é o contrato do repositório, e o projeto precisa de uma execução que dependa disso estar
  registrado como bloqueio externo — como já é o OAuth do Google/Microsoft na fase 10.
- Enquanto o pacote não sai, o trabalho da tela **não fica parado**: ela é escrita e verificada
  contra o tarball que o próprio CONTRIBUTING do DS indica para validar consumidores
  (`npm run build && npm pack`). O PR fica em draft, com a dependência declarada.
- O `package-lock.json` do front **nunca** é editado à mão com `resolved`/`integrity` inventados:
  eles precisam vir do registro. Um lock errado quebra `npm ci` no Docker e o erro aparece longe da
  causa.
- A regra vale para qualquer pacote compartilhado da organização: "mergeado" não é "publicado".

**Rejeitado.** Publicar com `npm publish` da máquina de trabalho — o workflow é o único caminho
aprovado, e o token de publicação não é do agente. Rejeitado também apontar o front para um link
`file:`/`link:` local do DS: resolveria a máquina, quebraria o CI e o Docker, e esconderia o
bloqueio real.

---

## D21 — O lembrete é do compromisso e da pessoa, e quem decide é o envio (execução 13)

**Contexto.** A D4 escolheu o mecanismo (tabela + worker com `attempts`). Faltava decidir o que é um
lembrete, quem recebe e quando.

**Decisão.**

1. **A chave é (entrada, pessoa, antecedência).** O organizador e cada convidado têm o próprio
   lembrete; duas pessoas não compartilham aviso. Um índice único na tabela garante isso, e o serviço
   só evita violar o índice — quem recusa a duplicata é o banco.
2. **Quem recebe é decidido no envio, não na criação.** A pessoa cria o lembrete quando entra no
   compromisso; se ela foi convidada e ainda não respondeu, o lembrete existe mas não notifica até
   aceitar. Fazer a checagem na criação exigiria reescrever a linha no instante da resposta e deixaria
   um buraco: quem aceita às 18h59 para um compromisso de 19h não seria avisado.
3. **Antecedência é lista fechada** (5, 15, 30, 60 minutos, 1 dia), validada no domínio e na
   `check constraint`. "Quero ser avisado 7 minutos antes" não é uma opção da tela; aceitar qualquer
   inteiro convida a API pública a virar cronômetro.
4. **Cancelar ou reagendar encerra os pendentes.** O aviso do horário antigo não sai. A linha não é
   apagada: `sentAt` marca "resolvido" e o motivo fica em `lastError`, o que preserva a diferença
   entre avisado, cancelado e encerrado.
5. **A notificação tem autor `system`.** `notifications.actor_id` é `not null` e não existe
   notificação sem ator no repositório; um lembrete não tem pessoa por trás e usar o id do compromisso
   misturaria entidade com pessoa.

**Consequência.**

- O lembrete sobrevive ao reinício do processo: ele é uma linha, não um `Runnable` agendado (razão
  original da D4).
- Compromisso criado em cima da hora gera lembrete já vencido, e ele sai **uma vez** no ciclo
  seguinte — o que a pessoa quer é o aviso agora.
- A tela só vê os lembretes **pendentes**; o histórico não entra na leitura.

**Rejeitado.** Notificar todo mundo que recebeu convite (`INVITED` incluso): o aviso de "começa em
5 min" para alguém que nunca disse que ia é ruído que ensina a pessoa a ignorar a notificação.

---

## D22 — O detalhe é rota própria (`/agenda/$entryId`), e o DS só recebe dados já traduzidos (execução 14)

**Contexto.** D15 decidiu que o item da agenda carrega o estado do convite. Faltava o lugar onde se
responde ao convite, se edita, se cancela e se convida mais gente. O `GET /calendar/entries/{id}`
já devolve `{ entry, owner, participation, participants }` (participants só para o organizador) e
aceita `PATCH`, `DELETE`, resposta de participante e convite — tudo pronto na `qa`.

**Decisão.**

1. O detalhe é **rota** (`/agenda/$entryId`), não modal sobre a lista: ganha URL própria, sobrevive
   a recarregar, e a lista continua sendo só leitura rápida. O `itemHref` da agenda aponta para ela.
2. O componente do DS (`CalendarEntryDetail`) é **burro**: recebe `entry`, `owner`, `participation`,
   `participants` e callbacks; não sabe de rota, query nem API. Toda tradução de instante para hora
   de parede acontece no app, com `wallClockOf(instant, timeZoneId)` (D17), e o app converte de volta
   com `instantOf` no salvar.
3. As mutações vivem na rota e **invalidam `['agenda']` inteiro**, não só o detalhe: responder,
   cancelar ou editar muda a lista, o detalhe e o estado do convite, e uma invalidação parcial deixa
   a lista mostrando estado velho que o usuário acabou de mudar.
4. Quem não é organizador recebe `participants: null` da API e a tela **não** monta a lista nem o
   formulário de convite — esconder por papel no cliente seria decoração, não autorização; a
   autorização é do backend (D5).

**Consequência.** O detalhe entrou no DS como `CalendarEntryDetail` (PR #177), com a microcópia no
pacote (`messages.detail.*`), e a rota no front usa exatamente esse componente (PR #777). Enquanto
o #177 não for mergeado e publicado, o `package.json` do front não tem de onde importar o
componente: o PR fica em draft com a dependência declarada, como D20 manda — não se cria uma cópia
local do componente na app, que violaria `local/no-front-markup` e divergiria do DS na primeira
correção.

**Rejeitado.** Modal de detalhe sobre a agenda: perde link direto e complica o retorno depois de
editar. Rejeitado também o DS buscar os próprios dados: acoplaria o pacote ao cliente de API do
app e impediria o storybook de renderizar o componente com dados fixos.
