# Painel de moderação e administração

A rota `/moderador` mantém a identidade e os privilégios confirmados por `GET /moderation/me`.
A apresentação fica em `ModeratorWorkspace` e `ReportsSection`, do design system; o frontend
mantém consultas, mutações, navegação e o mapeamento dos dados.

Esta continuação corresponde à issue **frontend#891**, relacionada ao histórico de navegação
**frontend#760 / PR#758**, sem reabrir ou duplicar aquela entrega. As mudanças coordenadas são
acompanhadas em **design-system#245** e **backend#729**.

## Navegação e fila

- As áreas aparecem agrupadas em uma coluna no desktop e em um seletor rotulado no celular.
  A busca de áreas é local e não muda a seleção antes da escolha de um destino.
- A área selecionada fica em `?aba=...`, permitindo recarregar e voltar pelo histórico do navegador.
  Valores desconhecidos são descartados; áreas administrativas continuam ocultas para não-admin.
- A área administrativa da rede já presente na QA é preservada, inclusive seus contratos e fluxo
  de provisionamento existentes. A PR#889 de token de provisionamento não faz parte deste porte.
- A fila distingue carregamento, falha com nova tentativa, ausência de denúncias e ausência de
  resultados no recorte. Erro de consulta não é interpretado como fila vazia.
- Motivo, tipo de alvo e busca podem ser combinados. A contagem se refere somente ao lote
  carregado pela API, não ao total de denúncias existentes no servidor.
- O modo pânico inativo usa a apresentação compacta recolhida neste painel. Estado ativo,
  bloqueado pelo ambiente ou ainda em consulta permanece visível. Isso não muda sua operação.
  Falha na consulta permanece expandida com alerta e nova tentativa, sem permitir alternar
  o modo com estado incerto. Uma falha não é apresentada como modo inativo.

## Votação e decisão emergencial

A votação coletiva continua usando `moderationApi.vote(reportId, vote)`, com o quórum devolvido
pelo backend. Os critérios da votação e das propostas manuais de sanção não foram modificados.

Administradores têm um bloco separado de **Ação administrativa direta**. **Punir agora** abre uma
confirmação com alvo, responsável, referência da denúncia e efeitos. Abrir ou cancelar a confirmação
não envia a punição. A operação confirmada usa `POST /admin/reports/{reportId}/penalize`, sem esperar
votos. Autorização e aplicação permanecem no servidor.

Essa operação aplica a restrição prevista pela política existente, não um banimento novo nem um
prazo inventado. Publicação e comentário do feed são removidos quando aplicável. Não há promessa de
remoção de conteúdo de grupo. Os recursos seguem a política vigente.

A opção exige autor identificável e um alvo suportado: `POST`, `COMMENT`, `USER`, `GROUP_POST`,
`GROUP_COMMENT` ou `CALL`. Denúncia de `COMPANY` oferece remoção da página, sem punir diretamente seu
dono. Alvos sem suporte não recebem um botão de punição que o backend recusaria.

Advertência e remoções também exigem confirmação no novo bloco. O envio e a atualização subsequente
bloqueiam ações repetidas. Uma falha transitória mantém o contexto e o erro dentro da confirmação.
Cancelar descarta o erro daquela tentativa; uma nova confirmação não herda falhas anteriores.
Se o servidor informa `409 ALREADY_REVIEWED`, o caso é retirado do cache da fila pendente, as consultas
são revalidadas e a confirmação obsoleta fecha, sem apresentar uma punição nova como sucesso.

Após uma decisão, fila, revisão da denúncia e lista administrativa de sanções são invalidadas.
A página de revisão `/moderacao/$reportId` também reconcilia esses dados após suas ações.

## Contrato e entrega coordenada

As ações de `reportsAdminApi` usam o objeto JSON `ReportView`. A correção coordenada do backend
remove o retorno textual de `record.toString()` nas ações diretas, sem relaxar o parser JSON do
cliente. A decisão humana registra o revisor e o instante; não é apresentada como análise automática.

As views e a propriedade opcional `PanicModeSection.compact` dependem do design system em revisão.
A prova histórica usou tarball da árvore de desenvolvimento, mantendo a versão-base do pacote.
A preparação de 19/11/2026 incorpora por merge a QA
`98435bc02f42e384c7e9a917e7ca70629a876716`, preservando seu manifesto e lockfile: referência
`^0.41.4`, resolução `0.41.4`. Isso não comprova os exports do pacote publicado nem uma instalação
limpa: as dependências físicas locais ainda contêm o tarball anterior, de versão-base `0.37.5`.
O coordenador instalará o tarball final do painel antes dos gates dependentes do DS. Não há caminho
local nem versão futura inventada nos manifestos. Publicação de versão ou pré-versão pelo mantenedor,
atualização coordenada do consumidor e instalação limpa continuam necessárias antes de liberar a
integração. Não houve deploy.

## Verificação

`src/components/moderation/reports-section.test.tsx` exercita o container com React Query e a view
real, substituindo apenas o transporte: carregamento, erro/retry, confirmação/cancelamento, envio
único, reconciliação, conflito já decidido, votação sem privilégio administrativo e alvos sem suporte.
`panic-mode-section.test.tsx` cobre consulta pendente, estado desconhecido após falha e recuperação
sem mudança do modo. A regressão de erro entre confirmações também usa a view real.

A prova de navegador utiliza o frontend real com API explicitamente simulada e dados fictícios.
Ela não é integração com backend real nem validação de produção. Os resultados históricos e suas
limitações ficam em `docs/proof/painel-admin/README.md`; a preparação inicial e histórica fica em
`docs/proof/painel-admin/INTEGRACAO-QA.md`. A reconciliação e os checks independentes de 19/11/2026
estão em `docs/proof/painel-admin/CONTINUACAO-2026-11-19.md`, sem atribuir os gates históricos à
composição atual.

A rota legada continua extensa, mas foi reduzida pela extração da fila e navegação. As seções
administrativas não envolvidas foram preservadas, sem uma refatoração visual geral do aplicativo.
