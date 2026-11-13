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

## D7 — Assinatura privada com token, somente leitura (implementada na execução 22)

`/calendar/subscribe/{token}.ics` responde sem sessão, mas o token é o segredo: gerado com
`SecureRandom`, guardado como hash, revogável e regenerável. Resposta `Cache-Control` curto com
`ETag` derivado do corpo, para o cliente não baixar a agenda inteira a cada ciclo.
Rate limit por token para não virar alvo de força bruta nem de DoS.

**Não** usar o `id` do usuário na URL, nunca. O token é a única credencial do link.

**O que a implementação fixou (execução 22).**

1. **O banco guarda só o hash SHA-256**, com índice único. O token em claro existe uma única vez, na
   resposta que o cria ou regenera; depois disso nem quem lê a tabela reconstrói o link.
2. **Uma assinatura ativa por pessoa.** Criar quando já existe devolve a existente **sem** token
   novo: não há como mostrá-lo de novo, e emitir um segundo link só multiplicaria credenciais vivas.
3. **Regenerar gira a mesma linha**, não cria outra. Assim não existe janela com dois links vivos, e
   o link antigo morre na mesma transação.
4. **O `scope` fica congelado no token** (nulo = agenda consolidada, o mesmo contrato da leitura).
   Trocar o recorte é regenerar o link, não um parâmetro que quem assinou escolhe.
5. **Token desconhecido e token revogado respondem o mesmo 404.** Distinguir confirmaria que aquele
   link já existiu — a mesma lógica da D10 para entrada alheia.
6. **A janela é derivada do começo** (30 dias atrás, 365 no total). Somar os dois prazos soltos
   estourava o teto de um ano do export e a rota respondia `INVALID_WINDOW`.
7. **O limite é por hash do token**, nunca pelo token em claro, como o resto de `shared.security`.

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
convidados, o caminho é o lote, como o chat fez em `#535`. **Teto (execução 37):** 100 convidados
por compromisso (`CalendarInvitationService.MAX_PARTICIPANTS`, `400 INVITE_LIMIT_REACHED`), contado
no banco por `countByEntry` — a lista do detalhe e cada convite são lidos inteiros, então o teto
protege exatamente o que cresce com o número de convidados. O worker de lembrete também deixou de
carregar a lista inteira: decide sobre a linha da pessoa (`findByEntryAndUser`).

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

---

## D23 — Conflito é leitura da mesma agenda, não um segundo motor (execução 17)

**Contexto.** A fase 6 pede "disponibilidade e conflitos". O inventário da execução 17 mostrou que
o backend já tinha as peças para uma _disponibilidade de mentor_ (`MentorAvailability` com dia da
semana + `HH:mm`, `MentorSlot` com instante único e `book`/`release`, geração de 28 dias em
`MentorService.saveAvailability`) — mas **nada** no nível da agenda: nenhuma consulta respondia
"o que já ocupa este intervalo?" e a escrita aceitava qualquer sobreposição sem avisar.

**Decisão.** Conflito é uma **consulta** sobre a agenda que a pessoa já vê, não um motor novo:

1. Fonte única: `CalendarQueryService.agenda` — dono mais convites **ACCEPTED** e **TENTATIVE**.
   Convite `INVITED` ou `DECLINED` não ocupa horário: ninguém deixa de marcar uma consulta por
   causa de um convite parado na caixa, e "recusei" é resposta, não compromisso.
2. **Leitura, não bloqueio.** A escrita continua aceitando sobreposição; a agenda social tem casos
   legítimos de duas coisas no mesmo horário. Um 409 transformaria o aviso em proibição e mudaria o
   contrato da escrita que já está em produção.
3. Intervalo **meio-aberto** nos dois lados (o mesmo de `CalendarEntry.overlaps` e da consulta por
   janela): 12h–13h e 13h–14h são contíguos, não sobrepostos.
4. `entryId` exclui a própria entrada: na edição, o compromisso não conflita consigo mesmo.
5. O filtro por `scope` é o da leitura; sem ele, as duas agendas.
6. Reaproveitar a consulta evita divergência de autorização (D5/D10): a lista nunca inclui agenda
   alheia porque a consulta é sempre `ownerId = quem lê`.

**Consequência.**

- A rota nasceu sem migração: não há tabela de conflito nem índice novo, porque conflito é derivado.
- A janela semanal de disponibilidade **continua faltando** e é coisa distinta: aquela é uma regra
  persistida (dia, início/fim, fuso) que gera janelas candidatas — o `MentorAvailability` de hoje
  é do perfil do mentor e não serve à agenda geral. Ficou como a próxima unidade da fase 6.
- O aviso na tela é decisão do formulário do DS: ele recebe a lista de conflitos e decide mostrar o
  texto; o app não bloqueia o salvar. Isso mantém a D18 (a superfície não busca dados sozinha).

**Rejeitado.** Devolver 409 na criação/edição quando há sobreposição: quebra o uso legítimo e
obriga o cliente a tratar erro para um aviso que é informativo. Rejeitado também calcular conflito
no front com a agenda já carregada: a agenda da tela é uma janela (mês/semana), e o formulário pode
estar criando num intervalo fora dela — o servidor precisa ser a fonte.

---

## D24 — Disponibilidade é regra da pessoa, guardada como semana substituível (execução 18)

**Contexto.** A fase 6 pedia "disponibilidade". O que existia era `MentorAvailability` no perfil de
mentor: dia da semana + `HH:mm`, sem fim nem duração, e `MentorSlot` com instante único. Nenhum dos
dois responde "quando esta pessoa aceita compromisso", e a agenda não tinha onde guardar isso. A
detecção de conflito da D23 só olha o que já está marcado; a disponibilidade é o outro lado — o que
a pessoa declara possível antes de qualquer compromisso existir.

**Decisão.**

- Tabela própria, `calendar_availability`, por **pessoa** (não por agenda social/profissional): o
  corpo é um só; quem separa as agendas é o compromisso, não a disponibilidade.
- Janela = `(dia ISO 1–7, início, fim, fuso IANA)`. Os horários são **de parede** (`time` no banco,
  `LocalTime` no domínio), não instantes: a regra é semanal e precisa continuar às 9h depois da
  mudança de horário da cidade. Guardar `Instant` obrigaria a reescrever a regra a cada mudança.
- **Meio-aberta**, igual à D13/D23: 9h–12h e 12h–18h se encostam sem sobrepor. Cruzar no mesmo dia
  é 400 `INVALID_AVAILABILITY` e a transação não grava nada — a semana anterior continua inteira.
- **Nenhuma janela atravessa a meia-noite.** Quem precisa das 22h às 2h declara duas janelas, uma
  em cada dia. Guardar uma janela com um horário só perderia o dia do fim, e o `time` do banco não
  tem como dizer "o dia seguinte".
- **Escrita por substituição** (`PUT /calendar/availability` com a semana inteira): a regra é o
  conjunto, não a linha. Isso elimina "apagar janela por id" e o estado em que a tela acha que
  apagou e o banco não; repetir o mesmo `PUT` é idempotente por natureza.
- Leitura e escrita sempre pela sessão (D10): não existe rota para a disponibilidade de outra
  pessoa, e não há id de pessoa no caminho.
- `check` no banco para dia 1–7 e fim depois do começo, e índice único por
  `(pessoa, dia, começo)`; a recusa de cruzamento fica no serviço, porque o banco não expressa
  "intervalos disjuntos" sem trigger.

**Rejeitado.** Guardar a disponibilidade em `Instant`s por semana concreta ("terça 12/11, 9h–12h"):
a regra se repete toda semana e materializar 52 semanas por ano faria a tela manter um calendário
paralelo. Rejeitado também reaproveitar `MentorAvailability`: é do perfil de mentor, não tem fim nem
fuso e mudá-la acoplaria a agenda geral à mentoria. Rejeitado, ainda, bloquear a criação de
compromisso fora da disponibilidade: disponibilidade é declaração, não cerca (mesmo raciocínio da
D23 — aviso, não 409).

**Limite conhecido.** Não há exceção por data (feriado, folga pontual) nem fuso por janela dentro da
mesma semana. Quando aparecer, o caminho é uma tabela de exceções por data, não colunas novas aqui.

---

## D25 — Contrato das superfícies de disponibilidade e do aviso de conflito (execução 19)

**Contexto.** Com o backend da disponibilidade (#613) e o aviso de conflito no formulário (#195), a
última peça era a tela: declarar a semana e ser avisado de sobreposição ao digitar. A pergunta de
desenho era onde ficam o rascunho da semana e a lista de conflito.

**Decisão.**

1. **`CalendarAvailabilitySurface` não busca e não salva** (D18 aplicada): recebe `windows` (o que
   o servidor devolveu), `timeZoneId`, `savePending`, `saveError` e `onSave(windows) => Promise<boolean>`.
   O estado editável vive na superfície porque é rascunho; a verdade vive no app.
2. **Semana nova do app substitui o rascunho** — comparação por identidade do array (`windows`), não
   por conteúdo: o app troca o array quando a consulta devolve algo novo, e um `useEffect` sobre
   conteúdo lutaria com a digitação.
3. **Salvar é substituição**: a superfície entrega a semana inteira (`CalendarAvailabilityWindowInput[]`),
   nunca "a janela X mudou". Espelha o `PUT` do backend e elimina a divergência de três operações.
4. **As regras de validação são duplicadas de propósito** no cliente (`calendar-availability-draft.ts`)
   com os mesmos limites do `CalendarAvailabilityService` (dia 1–7, `hh:mm`, fim estrito, meio-aberto,
   50 janelas). O servidor continua sendo a autoridade: o cliente só evita mandar o que se sabe
   recusável. Se divergirem, o erro do servidor aparece em `saveError` e os campos ficam.
5. **`conflicts` atravessa a `CalendarAgendaSurface`** até o formulário: a props existe na superfície
   porque a `/agenda` usa a superfície, não o diálogo. A app busca a lista por **janela visível, sem
   escopo** (o aviso vale para as duas agendas) e passa `CalendarAgendaItemData[]`; o recorte final é
   do formulário, contra o intervalo **nos campos** (D23), nunca contra a janela buscada.
6. **Falha da consulta de conflito é silenciosa**: sem lista, sem aviso. Um aviso ausente é melhor que
   um erro bloqueando a criação, e o salvar nunca depende dessa leitura.

**Consequência.** O app `/agenda` faz duas leituras da mesma janela (agenda e conflito). A chave do
conflito não leva `scope`, então trocar de aba não refaz a busca; `staleTime` de 30 s evita repetir a
leitura ao abrir o formulário várias vezes. `CalendarAgendaSurfaceProps.conflicts` é opcional: os
consumidores existentes seguem compilando sem mudança.

---

## D26 — O `.ics` é derivado da entrada, o import entra pela porta de origem (execução 20)

Exportar e importar iCalendar é função da entrada central, não de cada módulo — D6 na prática. O
que a execução 20 fechou de decisão:

1. **`UID` é função determinística da entrada:** a origem quando existe (`TIPO-ID`), `enois-`+id
   quando não. Duas exportações do mesmo banco produzem o mesmo arquivo; o leitor externo
   reconhece o compromisso entre exportações sem nenhuma coluna nova. `SEQUENCE` derivado de
   `updatedAt−createdAt` segue o mesmo princípio (sem contador persistido).
2. **Cancelamento é publicado, não apagado:** `STATUS:CANCELLED` com o mesmo `UID` — evento que
   some do arquivo nunca é removido em quem assina. É a D10 transplantada para o formato.
3. **Fuso no arquivo é real, não aproximado:** `VTIMEZONE` derivado das transições do `ZoneRules`
   do fuso de cada compromisso. Um deslocamento fixo (ou um `VTIMEZONE` de uma observância só)
   erraria o instante em metade do ano para fuso com horário de verão.
4. **Import entra pela porta de origem, não por INSERT:** cada `VEVENT` vira
   `CalendarSourceService.upsert` com origem `ICS`+`UID`. A idempotência do arquivo é a mesma
   idempotência da mentoria (D3): repetir o arquivo atualiza, não duplica. Import **não mescla**
   com compromisso criado na agenda — um não tem origem, e mesclar por título/horário seria
   adivinhação com dado pessoal.
5. **Import é escrita com teto:** `Idempotency-Key` obrigatória (D11), 512 KB e 500 eventos.
   Permissivo no formato (linha estranha não derruba o arquivo; `TZID` desconhecido cai no fuso
   padrão e o evento entra), estrito no volume — o que protege é o limite, não a recusa.
6. **O download é da janela visível:** o botão da `/agenda` exporta o que a tela desenha (janela
   do período + escopo da aba), não "tudo". Arquivo gigante e desalinhado do que se vê é pior que
   baixar de novo. A assinatura privada da fase 9 (D7) é que serve ao caso "agenda inteira,
   sempre atualizada" no leitor externo.

## D27 — A presença no evento é o fato; a entrada da agenda é consequência (execução 21)

A fase 4 começa pela fonte que já existe: o evento de grupo. O evento guarda data e hora como
texto livre (B2), mas `Event.startsAt()`/`expiresAt()` já leem esse texto no fuso da rede
(`America/Sao_Paulo`), então a agenda não precisa esperar a coluna tipada para desenhar o
compromisso. O que a execução 21 decidiu:

1. **A direção é evento → agenda, nunca o contrário.** `EventService` chama
   `CalendarSourceService` com origem `EVENT`+`eventId`; o calendário não conhece o módulo de
   eventos. É a D19 aplicada: quem é dono do fato grava a entrada, e o calendário só guarda.
2. **A presença confirmada é o gatilho, não a existência do evento.** O evento não vira
   compromisso de todo mundo: `attend` grava a entrada do participante, `cancelAttendance` a
   remove. Quem organiza e não confirmou presença não ganha entrada — a agenda é de quem vai.
3. **Sair do evento apaga a entrada; cancelar o evento também.** `delete` e `sanitizeExpired`
   removem a entrada de todos os participantes. Apagar é o oposto de cancelar (D10/D26): o fato
   deixou de existir, então não há cancelamento a publicar no `.ics` — a linha some. Por isso a
   porta ganhou `deleteBySource`, separada de `cancel`.
4. **O evento não tem hora de fim; a entrada ocupa uma hora.** `expiresAt()` devolve o começo
   quando não há fim, e a constraint exige `ends_at > starts_at`. Duração zero não existe na
   agenda, e "dia inteiro" mentiria sobre um encontro com hora marcada. Uma hora é o padrão
   explícito (`DEFAULT_EVENT_DURATION`), não um palpite escondido.
5. **Editar o evento move a entrada de todos os participantes.** `update` reescreve a entrada de
   cada um pela mesma origem (D3): o horário novo substitui o antigo, sem duplicar. E, como na
   edição direta, o lembrete pendente do horário antigo é encerrado — aviso no horário errado é
   pior que aviso nenhum (D21).
6. **A porta de origem limpa lembrete ao reagendar e ao cancelar.** Era um buraco real: o
   caminho direto (`CalendarCommandService`) já encerrava o pendente, mas o caminho de origem
   não. Agora `upsert` (quando move) e `cancel` chamam `clearPendingForEntry`, e o comportamento
   é o mesmo venha o compromisso da agenda, da mentoria, do import ou do evento.

## D28 — O desenho pede; a aplicação faz; o token só é visto uma vez (execução 24)

O bloco 24 levou import e assinatura para o DS e para a tela, e fechou três decisões de fronteira:

1. **Componente controlado não faz requisição — relata a intenção.** `CalendarImportDialog`
   recebe `onImport: () => Promise<CalendarImportResultData | null>`; o app executa o upload e
   devolve o resultado. Devolver `null` (erro ou falha) mantém o diálogo aberto com o arquivo
   ainda escolhido — o app decide o que acontece, o DS só desenha e valida o formato/tamanho
   antes de chamar. O mesmo split vale para `CalendarSubscriptionCard`: copiar, regenerar e
   revogar são callbacks do app; o card não conhece `calendarApi`.
2. **O resultado do import é contagem, não lista.** `{received, created, moved, cancelled,
skipped}` — o backend já responde isso e a tela não precisa dos compromissos para dizer
   "entendi 40, criei 12, cancelei 3". `cancelled` entra na conta de "aplicados" porque o
   cancelamento vindo do arquivo é mudança real na agenda (D10/D26), não rejeição.
3. **O token da assinatura vive no estado do app, não no card.** O servidor nunca devolve o
   token de novo (só o hash fica no banco); depois de criar/regenerar, a única cópia é a da
   resposta daquela requisição. Guardar o link montado no estado da rota é o que permite ao card
   alternar entre "link novo, copie agora" e "link ativo" sem o card precisar saber disso.
4. **O DS tem duas linhagens e o PR de componente mira a `qa`.** `origin/qa` e `origin/main` do
   design system **não têm ancestral comum** (`git merge-base` falha): `main` carrega os
   releases publicados (0.31/0.32), `qa` acumula 529 commits de feature. Regra mantida do
   AGENTS.md: PR de componente sai da `qa` e mira a `qa`; para validar o front (que consome o
   pacote da linhagem `main`), monta-se uma árvore de validação separada (`main` + os arquivos
   novos) só para gerar o tarball — nunca rebasear uma na outra nem "resolver" a divergência por
   conta própria. **Consequência operacional:** mergear o componente na `qa` não o publica. O
   front que depende dele fica com CI vermelho (`MISSING_EXPORT`) até um release a partir do
   `main` — e esse release é passo humano (D20). O vermelho é o B9 se manifestando, não regressão
   do código; declarar isso no PR evita que alguém "conserte" apagando o import.

## D29 — A entrevista é um compromisso só, escrito nos dois lados (execução 25)

A entrevista de candidatura não tem agenda própria: ela **é** uma entrada da agenda central,
escrita pela mesma porta de origem que a mentoria e o evento (D19). Três escolhas fecham a
fronteira:

1. **Um compromisso só, dois donos.** O `JobInterviewService` faz dois upserts com a mesma
   origem `(JOB_INTERVIEW, interviewId)` e donos diferentes (candidato e empregador), escopo
   PROFESSIONAL e tipo INTERVIEW. Como a origem é única, reagendar **move** as duas entradas e
   cancelar **cancela** as duas — sem duplicação nem desvio entre as agendas; e como o
   cancelamento pela porta de origem nunca reabre (D19/D26), entrevistador e candidato nunca
   veem estados diferentes do mesmo fato.
2. **O banco garante "uma valendo" por candidatura.** `V274` traz índice único
   `(application_id, status)` com `status` em `(SCHEDULED, CANCELLED)`: agendar de novo
   **reagenda** a entrevista existente em vez de criar outra, e o histórico de canceladas fica
   no banco sem competir com a que está valendo. O reagendamento idêntico não é operação: a
   janela igual não mexe em `updatedAt` nem dispara notificação.
3. **A tela desenha com o fuso da entrevista, não o do runtime.** O compromisso carrega o
   `timeZoneId` de quem marcou, e é nele que o DS e o front formatam a hora (`Intl.DateTimeFormat`
   com zona explícita, formatador em cache). A linha da candidatura e a entrada da agenda mostram
   o mesmo relógio para os dois lados; o helper único de datas do front ganhou `dataHoraEm` em
   vez de abrir exceção à regra do formato-único.

---

## D30 — Chamada não é compromisso; o que a agenda promete é o que tem hora marcada (execução 26)

A fase 4 pedia "conferir se o módulo de chamadas/vídeo tem data e hora legíveis antes de prometer
a entrada na agenda". A inspeção fechou a questão pelo lado do modelo, não da tela:

1. **Chamada é sessão ao vivo, não compromisso.** `CallSession` carrega `createdAt`, `answeredAt`,
   `endedAt`, `expiresAt` e `lastActivityAt` — todos instantes do passado ou de expiração, nenhum
   horário futuro combinado. Não existe "chamada marcada para amanhã" no domínio, então não há
   entrada de agenda a criar: prometer isso exigiria inventar um agendamento que o produto não
   tem. A agenda continua sendo a fonte de compromissos; a chamada é o canal que acontece agora.
2. **O que a chamada tem de temporal é a denúncia.** A denúncia de chamada carrega `reportedAt`,
   e é ele que ancora a captura de tela como prova. A tela de moderação recebia o campo e não o
   exibia; agora mostra o horário junto da captura, pelo utilitário único de data do front. É a
   mesma regra de D29: o instante vem do servidor e a tela não o reinterpreta.
3. **Consequência para a fase 4.** O que falta nela são **compromissos pessoais** (entrada criada
   pela própria pessoa), não chamadas. A presença em evento (D27) e a chamada ficam de fora da
   agenda por motivos diferentes: a primeira porque o evento já é o compromisso; a segunda porque
   não há compromisso.

---

## D31 — A entrada com origem é somente leitura na agenda; o módulo dono é quem muda o fato (execução 27)

A D19 deu à entrada com origem um dono, uma chave e um ciclo de vida próprios, mas deixou uma
porta aberta: a rota de escrita da agenda (`PATCH`/`DELETE /calendar/entries/{id}`) não olhava a
origem. Qualquer pessoa podia editar ou cancelar pela agenda um compromisso que veio de outro
módulo, e os dois lados passavam a contar histórias diferentes — a sessão de mentoria continuava
marcada com outro horário, o evento seguia com o participante.

**Decisão.** A escrita direta da agenda recusa entrada com origem preenchida.

1. **O servidor é quem garante.** `CalendarCommandService.update` e `cancel` verificam
   `entry.source().present()` e respondem **409 `CALENDAR_ENTRY_SOURCE_OWNED`**. A regra não depende
   da tela: mesmo que um cliente chame a rota direto, a entrada não muda.
2. **Quem muda o fato é o módulo dono.** Reagendar ou cancelar uma sessão de mentoria passa pelo
   `MentorService`, que chama `CalendarSourceService.upsert`/`cancel` (D19). O mesmo vale para
   evento (D27) e entrevista (D29). A agenda é projeção; o fato mora no módulo.
3. **A tela não oferece o que o servidor recusa.** O front decide por `isSourceOwned(entry)`
   (presença de `sourceType`) e não passa `onEdit`/`onCancel` ao `CalendarEntryDetail`. O
   componente do DS já esconde as ações quando o handler não vem, então a regra não exigiu mudança
   de contrato no DS — a mesma escolha de D28.1 (o desenho pede, a aplicação faz).
4. **Entrada avulsa continua editável.** Sem origem, a agenda é dona do compromisso e a escrita
   direta segue valendo. A distinção é exatamente a origem, não o tipo nem o escopo.

**Consequência.** Todo módulo que grava na agenda pela porta de origem ganha, de graça, a garantia
de que a agenda não vai divergir dele. Um novo tipo de compromisso com origem entra já protegido.

**Rejeitado.** Esconder o botão só na tela, sem a guarda no servidor: um cliente direto (ou uma
tela futura que esqueça a regra) voltaria a desincronizar o módulo dono. Rejeitado também deixar a
edição passar e "ressincronizar depois": não há como saber qual dos dois lados é a verdade.

---

## D32 — Apagar o perfil de mentor apaga o que é dele e cancela o que ainda vai acontecer (execução 27)

O `DELETE /mentors/{mentorId}` respondia **409** sempre que o mentor tinha qualquer horário
publicado: as FKs `fk_mentor_slots_mentor`, `fk_mentor_sessions_mentor` e
`fk_mentor_availabilities_mentor` bloqueavam a remoção da linha em `mentors`. O endpoint ficava
inutilizável assim que o mentor publicava a agenda. Evento e comunidade já apagavam as linhas
filhas antes da pai; a mentoria era o caso isolado.

**Decisão.** Apagar o perfil resolve o que depende dele, na ordem certa, dentro da mesma transação.

1. **Sessão agendada é cancelada, não apagada.** O perfil chama o mesmo caminho do cancelamento
   normal: o escrow volta integral para quem pagou e o compromisso é cancelado na agenda de quem
   marcou, pela porta de origem (D19). Apagar a sessão deixaria dinheiro retido e um compromisso
   fantasma.
2. **Sessão concluída é histórico.** Ela não é apagada; por isso a FK de `mentor_sessions` sai na
   **V275** (mesmo padrão deliberado da V132). A liquidação já trata o mentor ausente devolvendo o
   escrow, e as listas mostram a sessão sem o perfil.
3. **Horários e disponibilidade são do perfil e somem com ele.** São dados de publicação, não
   histórico; apagá-los é o que libera a remoção da linha pai.

**Consequência.** O mentor pode sair a qualquer momento, inclusive com agenda cheia, sem deixar
dinheiro preso nem compromisso órfão. O mentorado vê a sessão como cancelada, com o valor de volta.

**Rejeitado.** Desativar o perfil em vez de apagá-lo: o produto pede remoção, e um perfil "inativo"
que continua no catálogo é outra funcionalidade. Rejeitado também apagar as sessões em cascata:
destruiria o histórico e o registro do dinheiro.

---

## D33 — A edição da agenda reclassifica o que é dela e não toca no que é do módulo dono (execução 28)

O formulário de edição do DS mostra três campos de classificação — agenda (`SOCIAL`/`PROFESSIONAL`),
tipo e dia inteiro — e devolve os três no rascunho. O `PATCH /calendar/entries/{id}` só aceitava
título, descrição e horário. Trocar a agenda, o tipo ou marcar o dia inteiro e salvar era
descartado em silêncio: a tela fechava como se tivesse salvo, e a pessoa saía achando que tinha
mudado. O contrato do formulário e o do servidor tinham divergido sem que nenhum teste prendesse a
diferença.

**Decisão.** A edição parcial reclassifica a entrada, e só isso.

1. **`scope`, `kind` e `allDay` são editáveis pela rota da agenda.** São classificação, não fato:
   não mexem no intervalo nem na origem. `CalendarEntry.reclassify` troca os três e não toca em
   `startsAt`/`endsAt`/`source`; reclassificar para o mesmo valor não mexe em `updatedAt`.
2. **`allDay` é `Boolean`, não `boolean`.** Ausente precisa significar "não mexi". Um primitivo
   chegaria como `false` e desmarcaria o dia inteiro a cada edição de título — o mesmo raciocínio
   de campo nulo em D11.
3. **A guarda de origem continua valendo.** `reclassify` chama `requireActive` e a escrita segue
   recusando entrada com origem (D31) e entrada cancelada. Reclassificar não é uma porta lateral
   para mudar o fato de outro módulo.
4. **O front manda o que o formulário mostra.** `updateInputOf` converte o rascunho no corpo do
   `PATCH` com os oito campos, e o teste da rota prende que os três de classificação vão junto.
   Mandar só título e horário era a causa do descarte silencioso.

**Consequência.** O contrato do formulário e o do servidor voltam a coincidir, e a diferença fica
presa por teste dos dois lados. Um campo novo no formulário que o servidor não conheça passa a ser
uma divergência visível, não um descarte mudo.

**Rejeitado.** Fazer o formulário esconder os três campos: eles são parte do produto (a pessoa
escolhe a agenda e o tipo do compromisso) e esconder não corrige o contrato. Rejeitado também
tratar `allDay` como primitivo com valor padrão `false`: desmarcaria o dia inteiro em toda edição
que não falasse dele.

---

## D34 — O convite pendente é uma lista do servidor, e o aviso abre o que ele avisa (execução 29)

Duas lacunas da mesma família: o dado existia e a pessoa não chegava nele. O convite pendente tinha
cliente de API e rota (`GET /calendar/invitations`) desde a fase 1, mas nenhuma superfície o
desenhava — só aparecia se a pessoa abrisse o período em que ele cai, e um convite para o mês que
vem era invisível. O lembrete de compromisso criava a notificação apontando para
`/agenda?period=day`, e o front não tinha rota `agenda` na tabela de navegação: o clique não levava
a lugar nenhum; mesmo com a rota, levaria à agenda vazia, não ao compromisso anunciado.

**Decisão.**

1. **A lista de convites pendentes vem do servidor, não da janela na tela.** `CalendarPendingInvitations`
   recebe `invitations` já resolvidas por `GET /calendar/invitations` e as desenha **acima** da
   agenda. A janela visível é o recorte errado para essa pergunta: o convite que importa é
   justamente o que a agenda não mostraria.
2. **A resposta reusa a mutação da resposta rápida.** `CalendarAgendaSurface` repassa
   `onRespond`/`respondingId`/`respondError` ao componente; não há segundo caminho de escrita. O
   componente é controlado e não busca dados — a app é quem chama a API, como manda a camada
   `domain` do DS.
3. **O aviso abre o compromisso, não a agenda.** O `href` do lembrete é `/agenda/{entryId}` e o CTA
   é "Ver compromisso". Quem toca no lembrete quer ver quem convidou, onde é e o que responder.
4. **A tabela de navegação do front é o contrato do `href`.** Toda notificação que aponta para uma
   rota precisa de entrada em `src/utils/navigation.ts`; sem ela o clique cai no fallback e não
   navega. A ordem importa: `agenda/disponibilidade` vem antes de `agenda` com parâmetro, senão
   "disponibilidade" viraria `entryId`.

**Consequência.** O convite pendente passa a ter superfície própria e testada, e o lembrete leva ao
compromisso. A ligação na `/agenda` do front fica para depois do release do DS (B9), porque o
componente ainda não está em pacote publicado.

**Rejeitado.** Derivar os convites pendentes da janela já carregada pela agenda: esconderia
exatamente o caso que motiva a lista (convite fora do período visível) e faria a tela depender de
navegar até o mês certo. Rejeitado também manter o lembrete apontando para a agenda: a agenda não
diz qual compromisso é, e o aviso já sabe.

---

## D35 — A superfície de lembrete recusa o que não pode atender, e o aviso diz o tempo que falta (execução 31)

Três defeitos da mesma família na superfície de lembrete, todos no backend: o servidor respondia
"tudo certo" a pedidos que não podia atender. A leitura e a remoção de lembrete de um compromisso
alheio devolviam 200 vazio, enquanto o detalhe da entrada já devolvia 404 (D10) — o 200 confirmava
que aquele compromisso existe na agenda de outra pessoa. O `DELETE` sem `minutesBefore` devolvia 200
sem apagar nada, e a tela acreditava ter removido o lembrete. E o texto do aviso falava da
antecedência escolhida, não do tempo que falta: um lembrete de 1 dia criado em cima da hora
anunciava "em 1 dia" um compromisso que começava em 10 minutos.

**Decisão.**

1. **Ler, criar e remover lembrete exigem envolvimento, e o alheio é 404.** `requireInvolved` aceita
   dono ou participante e, fora disso, lança o mesmo `CALENDAR_ENTRY_NOT_FOUND` do detalhe. Um 403
   confirmaria a existência do compromisso na agenda de outra pessoa; o 404 não distingue "não
   existe" de "não é seu".
2. **Antecedência fora da lista é 400, não no-op.** `CalendarReminder.requireAllowedMinutes` é
   público e a remoção o chama antes de procurar a linha. Apagar "7 minutos antes" não tira lembrete
   nenhum: é pedido inválido, e a tela precisa saber disso em vez de achar que apagou. O controller
   recusa `minutesBefore` ausente com o mesmo 400 `INVALID_REMINDER`.
3. **O aviso fala do tempo que falta, não da antecedência escolhida.** `textUntil(startsAt, now)`
   devolve "já começou", "começa em N min", "começa em N hora(s)" ou "começa em N dia(s)". O worker
   pode atrasar, e o aviso não pode mentir sobre quando o compromisso começa.

**Consequência.** A superfície de lembrete passa a ter o mesmo contrato de autorização do detalhe da
entrada, e o texto da notificação é derivado do relógio no momento da entrega. A remoção idempotente
continua idempotente para uma antecedência válida (tirar duas vezes não é erro); o que deixa de ser
silencioso é o pedido malformado.

**Rejeitado.** Suprimir a notificação quando o compromisso já começou: o aviso ainda é útil ("já
começou" é informação verdadeira) e o worker atrasado não deve engolir o lembrete. Rejeitado também
manter o texto pela antecedência escolhida: é o número que a pessoa pediu, não o que o relógio diz.

---

## D36 — A rota sem sessão da assinatura tem dois tetos, e o import não reescreve o texto (execução 32)

Três defeitos na fronteira não autenticada do calendário. O `GET /calendar/subscribe/{token}.ics` é
a única rota do módulo que responde sem sessão, então é a que mais precisa de limite que funcione.

**Decisão.**

1. **Dois tetos, com papéis distintos.** O filtro limita a **origem** (600 leituras/min,
   `rede.rate.calendar-subscription-origin-per-minute`) antes de limitar o **token** (60/min). Um
   teto chaveado só pelo token é decorativo: o token vem do caminho, então quem varia o caminho
   recebe um balde novo a cada requisição e nunca alcança teto nenhum. A chave da origem não é
   escolhida pelo atacante, e é ela que põe um teto real na varredura. O valor por origem é folgado
   de propósito: leitores de calendário legítimos buscam de poucos endereços em nome de muita gente,
   e o filtro existe para cortar varredura, não para regular quem assinou.
2. **A limpeza descarta chaves vencidas, não baldes vazios.** Dentro da janela um balde nunca fica
   vazio, então remover vazios não libera nada e o mapa só cresce. A varredura roda quando o mapa
   passa do teto de chaves e remove as chaves cujas marcas já venceram.
3. **O recorte congelado recusa o divergente com 409.** `POST /calendar/subscription` com assinatura
   ativa e recorte **diferente** do congelado responde `409 CALENDAR_SUBSCRIPTION_SCOPE_CONFLICT`,
   dizendo que é preciso regenerar. Antes devolvia 200 com a assinatura existente, e a pessoa
   concluía que acabara de assinar a agenda profissional quando o token continuava na social: o
   recorte não muda no lugar, e um 200 afirmava o contrário. Recorte igual ou ausente continua
   idempotente, sem token na resposta.
4. **O `unescape` do RFC 5545 é uma passada só.** Desfazer o escape em cadeia de `String.replace`
   erra `\\n`: o primeiro `replace` casa a segunda barra com o "n" e produz barra mais quebra de
   linha, corrompendo qualquer caminho de arquivo no título ou na descrição, inclusive numa
   reimportação do export da própria agenda. Uma passada consome cada par barra+caractere e deixa
   escape desconhecido como está.

**Consequência.** A única superfície sem sessão do calendário passa a ter um limite que atua no caso
que motiva o limite, o pedido de assinatura passa a responder o que de fato aconteceu, e o texto que
entra por `.ics` sai igual.

**Rejeitado.** Limitar só por token com TTL de balde: continua permitindo varredura a custo de uma
chave por requisição e transforma o limite em amplificador de memória. Rejeitado também devolver 409
para a repetição do mesmo recorte: repetir o pedido é idempotente e é o que a tela faz ao reabrir.

## D37 — O teto de janela é da leitura, não da assinatura; o import mede antes de carregar (execução 33)

1. **Uma regra de janela para toda leitura por intervalo.** `CalendarWindows.validate` é o único
   lugar que decide o que é uma janela válida: `from`/`to` presentes, `to > from`, no máximo 366
   dias (`WINDOW_TOO_LONG`, 400). `CalendarQueryService` (lista, conflitos, detalhe da agenda) e
   `CalendarIcsService.export` chamam a mesma regra, e o controller só converte texto em instante.
   Antes, o export tinha teto e a lista autenticada não: o mesmo cliente podia pedir a agenda desde
   1970 pela rota que não paga a validação, o que carrega a agenda inteira com o join dos convidados.
   A assinatura `.ics` sem sessão já entrega 30 dias atrás e 365 à frente, então continua dentro.
2. **O import `.ics` mede o arquivo enquanto lê, não depois.** O teto de 512 KB
   (`rede.calendar.ics-max-import-bytes`) é aplicado sobre um `InputStream` lido em blocos; o
   arquivo nunca é materializado inteiro. O `Idempotency-Key` hasheia o fluxo pelo mesmo caminho,
   então repetir o upload idêntico é replay e trocar um byte é `IDEMPOTENCY_PAYLOAD_CONFLICT`, sem
   guardar o corpo do arquivo em memória para calcular o hash.
3. **Dois `VEVENT` abertos ao mesmo tempo são sintaxe quebrada, não dois eventos.**
   `BEGIN:VEVENT` dentro de outro `VEVENT` antes do `END:VEVENT` externo responde
   `400 INVALID_ICS`. Recomeçar o evento engoliria o de fora e contaria o de dentro, e a contagem
   devolvida ao cliente passaria a mentir sobre o que o arquivo tinha.
4. **`VTIMEZONE` é da janela e do fuso que ela usa.** O bloco abre com a observância em vigor na
   borda da janela (`TZOFFSETFROM` = `TZOFFSETTO` = deslocamento corrente) e percorre apenas as
   transições entre `from - 1 dia` e `to + 1 dia`, com teto de 400 blocos. Percorrer o tzdata desde
   1970 para exportar um mês inflava o arquivo, e não abrir com a observância vigente fazia um
   arquivo de janeiro carregar o deslocamento de verão do ano anterior.

**Consequência.** Toda leitura de agenda custa o que a janela pedida custa, o import recusa cedo um
arquivo grande em vez de copiá-lo primeiro, e o `.ics` exportado tem o tamanho do intervalo que ele
cobre.

**Rejeitado.** Derivar o teto da janela pelo tamanho da agenda (contar antes de buscar) — a contagem
é uma segunda consulta para responder 400, e a janela é o que o cliente controla. Rejeitado também
tratar `VEVENT` aninhado como dois eventos: a estrutura não existe no RFC 5545 e aceitá-la esconde
arquivo gerado por código quebrado.

## D38 — Falha de leitura não é dado vazio nem "não existe" (execução 33)

1. **A tela de disponibilidade não edita o que não leu.** Carregando, falha e semana carregada são
   três estados distintos. Na falha, a `CalendarAvailabilitySurface` não é montada — a superfície
   grava por substituição, então oferecer o formulário com `windows=[]` transformava "a consulta
   falhou" em "a pessoa apagou a semana". A falha mostra mensagem própria e "Tentar de novo".
2. **404 é o único "não encontrado".** No detalhe do compromisso, só `ApiError` com status 404
   significa que ele não existe (cancelado ou de outra pessoa). 5xx, 401 e falha de rede são erro de
   leitura: mensagem própria, recarga oferecida e nada de "não encontrado".
3. **Carregamento tem rótulo.** `LoadingState` vai sempre com `label`; o `role="status"` sem texto
   anuncia uma região vazia e deixa quem usa leitor de tela sem saber que a página está carregando.

**Consequência.** Qualquer tela do calendário que consulte antes de editar trata "não consegui ler"
como estado próprio, nunca como valor padrão — o padrão de uma escrita por substituição é apagar.

**Rejeitado.** Abrir a superfície em modo somente leitura na falha: no celular é a mesma tela com o
botão apagando a semana depois que a consulta volta, e o estado sem saída ("Tentar de novo") é o que
faz a tela ser útil de novo.

## D39 — O contraste é medido pelo teste que lê o tema, não por olho (execução 38)

1. **Um token, dois papéis, com prova.** O vermelho de erro serve ao preenchimento sólido (toast,
   botão destrutivo, com o foreground por cima) e ao texto de erro sobre o próprio tinte
   (`bg-destructive/10`, como as telas de agenda pintam). No claro, 0.6 de `oklch` dava 3,80:1 sobre
   o tinte; no escuro, o foreground claro dava 3,20:1 sobre o preenchimento. Os valores novos
   (0.48/0.2 no claro; 0.74/0.14 com foreground 0.2/0.03 no escuro) passam AA nos dois papéis e nos
   dois temas — e `src/calendar-contrast.test.ts` lê o `styles.css`, compõe o tinte e trava cada
   par, reusando a matemática de `src/lib/theme/color.ts`. Introduzir `vitest-axe` só para isso
   adicionaria `axe-core` sem cobrir nada que o teste não tranca.
2. **Classe sem token é defeito silencioso.** `border-border-strong` e `text-danger` eram usadas por
   componentes de calendário e **não existiam** no tema: a borda do item ativo do lembrete e a cor
   do erro do seletor simplesmente não pintavam, sem quebrar build nem teste. Token novo
   (`--border-strong`, 3:1 contra cartão e `surface-2`) nasce no mesmo commit que o conserto.
3. **Foco sobre preenchimento próprio inverte o anel.** O dia de hoje na grade é pintado com o
   primário; o anel do tema (`--ring`) é o mesmo primário — o foco ficava invisível (1:1). O anel
   usa `--primary-foreground`, a cor que já garantia contraste com aquele preenchimento como texto.
4. **Resultado que substitui o botão herda o foco e o anúncio.** No diálogo de import, o botão
   "Importar" desmonta quando o resultado aparece; sem mover o foco, ele caía no `body` e as contagens
   nunca eram anunciadas. O bloco de resultado é `role="status"` com `tabIndex={-1}` e recebe o foco
   ao montar — o gesto termina onde a informação apareceu.

**Consequência.** Qualquer token novo de cor entra com par de contraste no teste de tema, e qualquer
substituição de tela dentro de um diálogo move o foco para o que substituiu o elemento que o tinha.

## D40 — Ícone de controle tem régua própria: 3:1, não a de texto (execução 39)

1. **O critério vem do papel do pixel, não da cor.** A execução 38 mediu `text-destructive/70` com
   a régua de texto (4,5:1) e anotou pendência. Os dois usos são ícone de **botão** — chevron do
   banner de erro e lixeira do comentário: o ícone é o rótulo do controle, e a WCAG 1.4.11 pede 3:1
   para controle não-textual. Medido o par composto sobre cada superfície e sobre o próprio tinte
   de hover (o pior fundo), o mínimo é 3,37:1: passava desde o conserto anterior, e mexer no token
   teria sido mudança de pacote sem defeito.
2. **A régua errada também engana no outro sentido.** Se o par for julgado por 4,5:1, alguém pode
   "consertar" o ícone escurecendo o token e mudar o vermelho de todos os textos de erro do app
   junto — a régua de texto aplicada a ícone induz correção que ninguém pediu. O teste
   (`src/control-contrast.test.ts`) fixa 3:1 para os dois lados: reprovando o que passa pela régua
   de texto e trancando o valor contra afrouxamento silencioso.

**Consequência.** Todo par de cor em elemento só-de-ícone é medido por 1.4.11 (3:1); o teste de tema
traz as duas réguas, e a pendência anotada numa execução é re-medida com o critério do papel antes
de virar mudança de token.

## D41 — O seletor de horário é um grupo de rádio, e o banner mostra o que o servidor disse (execução 40)

1. **Escolher um horário é escolher um entre N, e o papel diz isso.** O agendamento de mentoria
   desenhava os horários como uma pilha de botões: nenhum estava marcado para o leitor de tela, e o
   teclado precisava de um Tab por opção. `CalendarSlotPicker` é um `radiogroup` — um tab stop, setas
   movendo escolha e foco juntos, `aria-checked` anunciando o escolhido, `aria-busy` enquanto a
   reserva voa e o erro da reserva desenhado dentro do grupo, onde a ação aconteceu. Clique repetido
   no escolhido desfaz (`onChange(null)`), para o gesto ser reversível sem caçar um "limpar".
2. **Mensagem de erro em texto é o erro.** O estado de erro de um formulário é `useState<string>`;
   `describe()` do `ErrorBanner` tratava `ApiError` e `Error` e mandava todo o resto para "Erro
   inesperado". O banner existia e ainda assim escondia o que o servidor devolveu — um defeito
   silencioso, porque a tela "funcionava". String não vazia entra como mensagem; vazio e valor
   desconhecido continuam no genérico, que é o certo para `undefined` e objeto sem mensagem.
3. **Ação não é detalhe: por isso o banner não ganha botão.** Os dois blocos que oferecem "Tentar de
   novo" continuam fora do banner nesta rodada. Enfiá-los no `ErrorBanner` seria acrescentar slot de
   ação ao contrato do DS; o conserto do defeito não é o lugar para essa mudança de contrato.

**Consequência.** Seleção entre opções finitas nasce como radiogroup no DS, nunca como lista de
botões; e todo ponto que mostra erro passa pelo mesmo banner, que nunca substitui a mensagem real
por uma genérica.
