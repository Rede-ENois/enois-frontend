# Rotas

As rotas são geradas pelo TanStack Router com SSR — o índice completo está no fim desta página.

## `/` - Landing Page (`src/routes/index.tsx`)

Página de marketing pública. Sem autenticação necessária.

**Componente:** `Landing()`

Seções:

- Header com navegação interna (Filosofia, Recursos, Comunidade)
- Hero com CTA para criar conta ou explorar
- Seção "Filosofia" com 4 valores (Autenticidade, Colaboração, Aprendizado, Segurança)
- Seção "Recursos" com 6 features (Discussões, Mentoria, Comunidades, Conexões, Recrutamento, Bem-estar digital)
- CTA final com criação de conta
- Footer

## `/feed` - Feed Principal (`src/routes/feed.tsx`)

**Auth:** Obrigatória (`requireAuth`)

**Componente:** `Home()`

Funcionalidades:

- **Compositor de posts** com textarea com @menção, seletor de tipo (INSIGHT, ARTICLE, QUESTION, PROJECT), upload de mídia (imagem/vídeo)
- **Identidade ativa:** escolhida no menu da conta; com a profissional, o compositor publica no feed corporativo (`BUSINESS`) e os tipos de página/artigo saem da seleção — regras em `componentes.md`
- **Abas de filtro:** Para você, Tudo, Seguindo, Discussões, Projetos. "Para você" is the default tab (the one that shows the "você está em dia" marker).
- **`?compor=ARTICLE`:** opens the composer in article mode, then drops the param from the URL. The profile quick composer "Escrever artigo" shortcut links here.
- **Feed infinito** de `PostCard` components
- **"Você está em dia" (only on "Para você"):** the first `FOR_YOU` page carries `lastSeenAt`; every
  other tab gets null and never calls `POST /feed/seen`. The value is kept for the visit (a refetch does
  not move it). "Para você" is ordered by relevance, so the loaded posts newer than the marker go first,
  newest first, then the `CaughtUpDivider`, then the rest in API order (`caughtUpOrder`). The divider
  shows only with a marker, a new post above and an old post loaded below. The backend pages "Para
  você" by date window, so the list only grows at the end. When the first post leaves through the top,
  `POST /feed/seen` goes once per visit with the newest loaded `createdAt` (`src/lib/feed/caught-up.ts`).
- **Dúvidas:** no "Tudo", o filtro de tipo "Dúvidas" (`type=QUESTION`) mostra o `QuestionStatusFilter` (Todas, Abertas, Resolvidas → `resolved` omitido, `false`, `true`). Com o tipo Pergunta no compositor aparece o `QuestionComposerHint`. Quem perguntou marca a resposta de outra pessoa nos comentários (otimista, desfaz se a API recusar); a resposta aceita sobe para o topo da lista
- **Sidebar direita:** Mini-perfil, sugestões de conexão, eventos

**Componentes auxiliares:**

- `ComposerAction()` - Botão de tipo de post no compositor
- `TabPill()` - Botão de aba de filtro

## `/entrar` - Login/Signup (`src/routes/entrar.tsx`)

Página pública de autenticação com duas abas.

**Parâmetros de busca:** `tab` = "login" | "signup" (default: "signup")

**Componente:** `Auth()`

- Sidebar com branding e depoimento
- Abas "Criar conta" / "Entrar"
- Botões SSO Google/Apple (placeholders não funcionais)
- Formulário de cadastro com validação Zod (name, email, password)
- Formulário de login com validação Zod (email, password)
- Salvamento de token no localStorage após sucesso

**Componentes auxiliares:**

- `TabBtn()` - Botão de alternância de aba
- `SocialButtons()` - Botões SSO
- `Divider()` - Divisor "ou com e-mail"
- `SignupForm()` - Formulário de cadastro
- `LoginForm()` - Formulário de login
- `Field()` - Wrapper de campo de formulário
- `GoogleIcon()` / `AppleIcon()` - Ícones SVG

## `/comunidades` - Lista de Comunidades (`src/routes/comunidades.tsx`)

**Auth:** Obrigatória

**Componente:** `Comunidades()`

- Filtro por tópico (Todas, TECNOLOGIA, ENGENHARIA, DESIGN, PRODUTO, LIDERANCA, CARREIRA, FREELANCE)
- Grid de cards de comunidades com cover, avatar, nome, descrição, membros
- Botão "Entrar"/"Participando" com mutation
- Load more com cursor
- Dialog de criação de comunidade (nome, descrição, tópico, cidade e UF opcionais)
- "Perto de você" (com sessão): `LocalCommunitiesSection` do DS com `/communities/local`; sem
  cidade no perfil, o convite abre `ProfileCityDialog` ali mesmo
- Filtro de local (`CommunityLocationFilter`) na URL: `?uf=MG&cidade=Belo%20Horizonte` (UF sozinha
  filtra o estado; cidade só vale com UF). As seções fixas (minhas, favoritas) seguem o filtro

**Componentes auxiliares:**

- `CreateCommunityDialog()` - Dialog de criação

## `/comunidades/$communityId` - Detalhe da Comunidade (`src/routes/comunidades.$communityId.tsx`)

**Auth:** Obrigatória

**Loader:** Busca dados da comunidade, `notFound` se não existir

**Componente:** `CommunityDetail()`

- Cover, avatar, nome, descrição, tópico, membros
- Botão Entrar/Sair
- Admin pode editar (nome, descrição, cover, avatar com crop, cidade e UF)
- Cidade/UF no cabeçalho (`LocationLine`) quando a comunidade tem lugar
- Feed da comunidade com posts (membros podem postar)
- Lista de membros na sidebar

**Componentes auxiliares:**

- `EditCommunityForm()` - Formulário de edição da comunidade

## `/par-de-estudo` - Par de estudo (`src/routes/par-de-estudo.tsx`)

**Auth:** Obrigatória (`requireAuth`, também em `PROTECTED_ROUTES`)

**Componente:** `StudyPairs()` (`src/components/study-pairs/study-pairs.tsx`) sobre o `StudyPairsView` do DS

- Pares ativos com o check-in da semana dos dois (`""` = check-in sem comentário, `null` = ainda não), semanas anteriores e encerrar par
- Pedido em espera (cancelar) e formulário de pedido com assunto opcional e objetivos populares
- Erros do pedido explicados pelo código do backend; `BIRTH_DATE_REQUIRED` leva a `/perfil` e `EMAIL_NOT_VERIFIED` a `/seguranca`
- Módulo desativável `STUDY_PAIRS` (`disabledModules`): desligado, some do menu, a rota cai no `ModuleDisabledGate` e as notificações `STUDY_PAIR_*` ficam ocultas; um `409 STUDY_PAIRS_DISABLED` no pedido (módulo desligado em outra aba) mostra o erro no formulário com o botão "Ligar par de estudo", que religa o módulo (`useReenableModule`, o mesmo do gate) sem reenviar o pedido. Ligado, as notificações abrem esta rota pelo `navigateToHref`
- Busca por assunto (`GoalSearch`, acima da lista): a partir de 2 letras consulta `GET /study-pairs/search` com espera de 300 ms e mostra os pedidos abertos com aquele termo (objetivo + tema, sem identificar ninguém); "Pedir par com esse objetivo" envia o pedido com o texto escolhido pela mesma rota de sempre

## `/eventos` - Eventos (`src/routes/eventos.tsx`)

**Auth:** Obrigatória

**Componente:** `Eventos()`

- Grid de `EventCard` (DS): data, formato (Online/Presencial/Híbrido), título, host, local e link ao vivo, cadência da série e próxima data, participantes
- Botão "Confirmar presença" / "Desconfirmar presença" (otimista em todas as listas em cache); card marcado com "Você vai" quando `attending`
- Filtro `EventRitualsFilter` (Todos / Rituais → `GET /events?recurring=true`, chave `["events","recurring"]`)
- Quem criou o evento (`canManageRecurrence`) vê o `EventRecurrenceControl` sob o card para trocar ou parar a série
- O mesmo painel do criador tem "Editar evento" (`PATCH /events/{id}`, formulário pré-preenchido, sem tocar na repetição) e "Excluir" (`DELETE /events/{id}`, com confirmação)
- Dialog de criação de evento (título, data, hora, realizador, formato, repetição); evento que se repete exige horário; presencial e híbrido
  pedem também cidade e UF estruturadas (`CityStateField`), além do local livre
- `?evento=<id>` (notificação `EVENT_NEXT_OCCURRENCE`, via `navigateToHref`, que preserva a query string) rola até o card e o destaca por 4 s

**Componentes auxiliares:**

- `EventForm()` - Formulário de criação e de edição do evento (a repetição só aparece na criação)
- `Field()` - Wrapper de campo

## `/mensagens` - Mensagens (`src/routes/mensagens.tsx`)

Página pública (mostra layout mesmo sem auth, mas sem funcionalidade).

**Componente:** `Mensagens()`

- Layout de duas colunas: lista de conversas + chat
- Busca de contatos para iniciar conversa
- Criação de conversa com mutation
- Envio de mensagens com poll a cada 10s
- Scroll automático para últimas mensagens
- Marcação de lidas ao selecionar conversa

**Componentes auxiliares:**

- `ConversationItem()` - Item da lista de conversas
- `ConversationHeader()` - Cabeçalho do chat ativo
- `formatTime()` - Formata timestamp relativo

## `/mentoria` - Mentoria (`src/routes/mentoria.tsx`)

**Auth:** Obrigatória

**Componente:** `Mentoria()`

- Hero com explicação do programa de mentoria
- Grid de cards de mentores
- Card: avatar, nome, headline, especialidades, avaliação, sessões, preço, próximo horário
- Dono do perfil pode editar/excluir mentoria
- Dialog de cadastro como mentor (especialidades, preço)

**Componentes auxiliares:**

- `RegisterMentorForm()` - Formulário de cadastro de mentor
- `MentorCard()` - Card de mentor
- `EditMentorForm()` - Formulário de edição de mentor

## `/rede` - Rede de Conexões (`src/routes/rede.tsx`)

**Auth:** Obrigatória

**Componente:** `Rede()`

- Cards com estatísticas (conexões, seguindo, solicitações, sugestões)
- Painel de convites (`NetworkRequests` do design system): recebidos e enviados em duas abas,
  resposta na própria linha (progresso, desfecho ou falha). A linha respondida fica no lugar com o
  desfecho até sair da página (`src/lib/network/network-requests.ts`). A pessoa do outro lado vem
  pronta do `/network/requests` (`peer`), sem uma busca de perfil por convite.
- Grid de sugestões de conexão com avatar, nome, headline, interesses em comum
- Botão Conectar/Remover

**Componentes auxiliares:**

- `Stat()` - Card de estatística

## `/boas-vindas` - Onboarding (`src/routes/boas-vindas.tsx`)

**Auth:** Obrigatória (também na revalidação central do cliente, `src/lib/require-auth.ts`)

**Componente:** `OnboardingFlow` (`src/components/onboarding/onboarding-flow.tsx`) sobre o
`OnboardingView` do design system.

- Passo 1: assuntos (os de `TOPICS` sem "Todas") e habilidades, já semeadas com as do perfil.
- Passo 2: pacote inicial (`GET /me/onboarding/starter-pack`) com comunidades, grupos e pessoas,
  tudo marcado; a pessoa desmarca o que não quiser.
- Concluir (`POST /me/onboarding/complete`) ou pular (`POST /me/onboarding/skip`) marca o
  onboarding em `["auth-me"]`, invalida `["me"]` e o feed e leva ao `/feed`.
- Quem chega: login, e-mail confirmado e retorno do OAuth vão direto para cá quando
  `/auth/me` traz `onboardingCompleted: false` (`landingPathFor` em `src/lib/onboarding.ts`). A guarda
  central `OnboardingRedirect` (montada no root) cobre quem abre o `/feed` por outro caminho. Nos
  dois casos o desvio acontece **uma vez por sessão** (`sessionStorage`): sair sem concluir nunca
  prende a pessoa fora do feed.

### What's new popup

`WhatsNewGate` (`src/components/whats-new/whats-new-gate.tsx`, mounted on the root) opens the DS
`WhatsNewDialog` on `/feed` once per release, only after the onboarding is done and never on top of
an admin notice popup. The release is written by an admin in `/moderador` (tab "Novidades",
`ReleaseNotesSection` over the DS `ReleaseNotesEditor`) and read from `GET /novidades/atual`; nothing
on air means no popup. Its `updatedAt` is the version: the last seen one is kept in `localStorage`
(`whats-new-seen`), so each browser shows a release once and a republish opens it again. It is
separate from the platform notice (tab "Avisos", free HTML), which keeps working as before.

## `/notificacoes/preferencias` - Preferências de notificação (`src/routes/notificacoes.preferencias.tsx`)

**Auth:** Obrigatória (também na revalidação central do cliente)

**Componente:** `NotificationPreferencesPanel` (`src/components/notifications/notification-preferences-panel.tsx`)
sobre o `NotificationPreferences` do design system.

- Resumo semanal por e-mail e as categorias de push; cada switch salva sozinho (PUT parcial),
  muda na hora e volta ao valor anterior se o servidor recusar.
- Push desligado neste aparelho: as categorias continuam editáveis e a tela oferece ligar.
- Entrada pelo menu da conta (`hrefs.notificationPreferences`) e pelo ícone no cabeçalho do sino
  (`preferencesHref`), os dois desenhados pelo design system.

## `/salvos` - Posts Salvos (`src/routes/salvos.tsx`)

**Auth:** Obrigatória

**Componente:** `SavedPosts()`

- Lista de posts salvos pelo usuário
- Empty state quando não há salvos
- Link de volta ao feed

## `/vagas` - Vagas (`src/routes/vagas.tsx`)

**Auth:** Obrigatória

**Componente:** `Vagas()`

- Filtros: query (texto), nível (Junior/Mid/Senior/Lead), local (Remoto/Híbrido/Presencial), tipo (CLT/PJ/Freelance/Intern), habilidades
- Grid de cards de vagas com título, empresa, logo, local, tipo, nível, salário, match score, skills
- Botão "Candidatar" com mutation
- Infinite scroll com IntersectionObserver

**Componentes auxiliares:**

- `formatPostedAt()` - Formata data de postagem
- `InfiniteScroll()` - Trigger de scroll infinito

## `/perfil/$username` - Perfil do Usuário (`src/routes/perfil.$username.tsx`)

Página pública (qualquer um pode ver). Loader busca dados ou `notFound`.

**Componente:** `Profile()`

- Banner editável com hover e crop
- Avatar editável com hover e crop
- Nome, headline, badges (openToWork, isMentor), empresa, local, conexões, reputação
- Seções: Sobre, Habilidades, Objetivos, Publicações
- Sidebar: Disponibilidade, Recomendar, Recomendações recebidas, Ranking, Links externos
- Dono do perfil: botão "Editar perfil" com dialog multi-aba
- Cidade estruturada: o dono vê a sua (de `/me`) e abre `ProfileCityDialog` (cidade, UF e
  "mostrar no perfil"); quem visita só vê `LocationLine` quando o dono escolheu mostrar. O campo
  livre "local" continua separado
- Outros usuários: botões "Mensagem" e "Conectar"
- Recomendação com dialog

**Componentes auxiliares:**

- `Section()` - Wrapper de seção do perfil
- `RecommendationItem()` - Item de recomendação

## Tratamento de Erros por Rota

| Rota                        | NotFound                | ErrorComponent              |
| --------------------------- | ----------------------- | --------------------------- |
| `/comunidades/$communityId` | `notFound()` no loader  | -                           |
| `/perfil/$username`         | "Pessoa não encontrada" | "Não foi possível carregar" |
| `__root` (qualquer outra)   | 404 genérico            | Error boundary com reset    |

---

## Índice completo de rotas

Todas as rotas do TanStack Router (arquivo em `src/routes/`). Detalhes por página vêm nas rodadas
seguintes; aqui é o mapa completo.

| Rota                             | Arquivo                                          | Descrição                                                                       |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `/apoiar`                        | `apoiar.tsx`                                     | Página de apoio com Pix (BR Code gerado no cliente) e carta do manifesto.       |
| `/auth/callback`                 | `auth.callback.tsx`                              | Callback de OAuth (Google/Apple/LinkedIn) e 2FA federado.                       |
| `/auth/redefinir`                | `auth.reset.tsx`                                 | Redefinição de senha por token de e-mail.                                       |
| `/auth/verificar`                | `auth.verify.tsx`                                | Verificação de e-mail do cadastro (token do link).                              |
| `/blog/:username`                | `blog.$username.tsx`                             | Blog de um usuário.                                                             |
| `/blog/:username/:postId`        | `blog.$username_.$postId.tsx`                    | Post de blog público (com assinatura).                                          |
| `/blog/post/:postId`             | `blog.post.$postId.tsx`                          | Post por id (compartilhamento).                                                 |
| `/blog/post/novo`                | `blog.post.new.tsx`                              | Editor de post de blog.                                                         |
| `/blogs`                         | `blogs.tsx`                                      | Catálogo de blogs.                                                              |
| `/bloqueados`                    | `bloqueados.tsx`                                 | Lista de usuários bloqueados (desbloquear).                                     |
| `/boas-vindas`                   | `boas-vindas.tsx`                                | Onboarding: interesses e pacote inicial (uma vez por sessão até concluir).      |
| `/carteira`                      | `carteira.tsx`                                   | Carteira em faíscas: saldo, transferências, contestações.                       |
| `/comunidades`                   | `comunidades.tsx`                                | Catálogo de comunidades.                                                        |
| `/comunidades/:id`               | `comunidades.$communityId.tsx`                   | Página da comunidade (posts, membros, regras).                                  |
| `/comunidades/:id/canais/:canal` | `comunidades.$communityId.canais.$channelId.tsx` | Canal privado de uma comunidade; acessível somente a membros.                   |
| `/contato`                       | `contato.tsx`                                    | Contato com o time (abre ticket de suporte).                                    |
| `/denuncias`                     | `denuncias.tsx`                                  | Minhas denúncias e seus estados.                                                |
| `/developers`                    | `developers.tsx`                                 | Portal de desenvolvedores da API pública (catálogo + casos de uso).             |
| `/diretrizes`                    | `diretrizes.tsx`                                 | Diretrizes da comunidade.                                                       |
| `/empresa/:slug`                 | `empresa.$slug.tsx`                              | Página pública da empresa: vagas, microprojetos, avaliações e painel da equipe. |
| `/empresas`                      | `empresas.tsx`                                   | Diretório: páginas da rede primeiro, empresas só com vagas em lista compacta.   |
| `/entrar`                        | `entrar.tsx`                                     | Login e cadastro (e-mail + social + 2FA).                                       |
| `/par-de-estudo`                 | `par-de-estudo.tsx`                              | Pares de estudo com check-in semanal.                                           |
| `/eventos`                       | `eventos.tsx`                                    | Catálogo de eventos com RSVP.                                                   |
| `/feed`                          | `feed.tsx`                                       | Feed principal: compositor, abas, feed infinito, sidebar.                       |
| `/freelances`                    | `freelances.tsx`                                 | Freelances; visitante vê o aviso e o botão de candidatura.                      |
| `/games`                         | `games.tsx`                                      | Catálogo de jogos da comunidade.                                                |
| `/games/:username`               | `games.$username.tsx`                            | Página de criador de jogos.                                                     |
| `/games/:username/:gameSlug`     | `games.$username.$gameSlug.tsx`                  | Página pública de um jogo (jogar no sandbox).                                   |
| `/games/painel`                  | `games.painel.tsx`                               | Painel do criador: publicar/editar jogo, novidades, analíticos.                 |
| `/grupos`                        | `grupos.tsx`                                     | Catálogo de grupos.                                                             |
| `/grupos/:slug`                  | `grupos.$slug.tsx`                               | Página do grupo (posts, membros, tópicos).                                      |
| `/`                              | `index.tsx`                                      | Landing page pública.                                                           |
| `/jogos-diarios`                 | `jogos-diarios.tsx`                              | Jogos diários com recompensa em faíscas.                                        |
| `/marketplace`                   | `marketplace.tsx`                                | Marketplace de itens digitais (compra com escrow).                              |
| `/mensagens`                     | `mensagens.tsx`                                  | Mensagens diretas (conversas, exclusão para mim).                               |
| `/mentoria`                      | `mentoria.tsx`                                   | Mentorias com agendamento.                                                      |
| `/meus-servicos`                 | `meus-servicos.tsx`                              | Painel de gerenciar serviços (ofertas, contratos).                              |
| `/moderacao`                     | `moderacao.tsx`                                  | Fila de recursos de penalidades e votação de punição.                           |
| `/moderacao/:reportId`           | `moderacao.$reportId.tsx`                        | Decisão de recurso/fila filha da moderação.                                     |
| `/moderador`                     | `moderador.tsx`                                  | Painel do moderador: todas as filas + monitoramento (candidatura é só admin).   |
| `/notificacoes/preferencias`     | `notificacoes.preferencias.tsx`                  | Resumo semanal e categorias de push.                                            |
| `/penalidades`                   | `penalidades.tsx`                                | Minhas penalidades e recursos.                                                  |
| `/perfil/:username`              | `perfil.$username.tsx`                           | Perfil público (posts fixados, ranking de chegada, projetos).                   |
| `/perfil`                        | `perfil.index.tsx`                               | Meu perfil (redireciona/edição).                                                |
| `/post/:postId`                  | `post.$postId.tsx`                               | Post individual (compartilhamento público).                                     |
| `/privacidade`                   | `privacidade.tsx`                                | Política de privacidade.                                                        |
| `/profissional`                  | `profissional.tsx`                               | Perfil profissional (edição).                                                   |
| `/profissional/:username`        | `profissional_.$username.tsx`                    | Perfil profissional público.                                                    |
| `/projetos/:username`            | `projetos.$username.tsx`                         | Projetos de um usuário.                                                         |
| `/projetos/:username/:slug`      | `projetos.$username.$projectSlug.tsx`            | Página de projeto da comunidade.                                                |
| `/projetos`                      | `projetos.index.tsx`                             | Catálogo de projetos da comunidade.                                             |
| `/projetos/painel`               | `projetos.painel.tsx`                            | Painel de projetos (criar/editar, fila de revisão).                             |
| `/rede`                          | `rede.tsx`                                       | Minha rede (convites, sugestões e conexões).                                    |
| `/responsavel`                   | `responsavel.tsx`                                | Fluxo de responsável parental (ECA).                                            |
| `/salvos`                        | `salvos.tsx`                                     | Posts salvos.                                                                   |
| `/seguranca`                     | `seguranca.tsx`                                  | Segurança da conta: senha, 2FA, sessões, contas vinculadas.                     |
| `/servicos`                      | `servicos.tsx`                                   | Catálogo de serviços (contratar).                                               |
| `/sobre`                         | `sobre.tsx`                                      | Sobre o projeto.                                                                |
| `/suporte`                       | `suporte.tsx`                                    | Central de suporte (tickets, FAQ).                                              |
| `/sugestoes`                     | `sugestoes.tsx`                                  | Enviar sugestão (anônima na issue pública, após aprovação) e ver as minhas.     |
| `/termos`                        | `termos.tsx`                                     | Termos de uso.                                                                  |
| `/vagas`                         | `vagas.tsx`                                      | Catálogo de vagas com busca booleana.                                           |
| `/vagas/:jobId`                  | `vagas.$jobId.tsx`                               | Detalhe da vaga (candidatar, salvar).                                           |
| `/vagas/:jobId/candidaturas`     | `vagas.$jobId.candidaturas.tsx`                  | Candidaturas da vaga (painel do contratante).                                   |
| `/vagas/minhas`                  | `vagas.minhas.tsx`                               | Minhas vagas (publicadas e candidaturas).                                       |

`?reacoes=1` em `/post/:postId` abre a lista de quem reagiu (vem da notificação agrupada "Ana e mais
14 pessoas reagiram ao seu post"); o parâmetro sai do endereço depois de abrir.

Na ativação do segundo fator por e-mail em `/seguranca`, o campo exige exatamente seis dígitos,
preserva zeros iniciais e remove caracteres não numéricos na digitação e na colagem. O preenchimento
automático usa `one-time-code`.

O campo usa o `Input` de `@rede-enois/design-system/ui` na versão `0.12.0`, com `maxLength={6}` e
`showCounter={false}`. O limite nativo de seis caracteres permanece ativo, sem exibir o contador
ou o aviso de limite atingido.

## Nametag do perfil profissional

O `:username` de `/profissional/:username` é o **nametag** do perfil profissional: ele é o `@` e o
fim da URL pública, tem namespace próprio no backend e pode ser diferente do `@` social (ex.:
`aminadojava` no social e `melsantos` no profissional). É editável em `/profissional`, num campo
com ação própria (não espera o resto do formulário); o formato é validado em
`src/lib/corporate/nametag.ts`, o mesmo do backend. Trocar o nametag muda o endereço público — o
antigo deixa de responder — sem tocar no perfil social.

Em grupos, o dono pode selecionar um tópico e usar **Renomear tópico** para editar o nome
pelo diálogo. O formulário aceita até 80 caracteres e usa o PATCH existente, mantendo a descrição,
a seleção e o conteúdo do tópico. Após salvar, os rótulos do feed são atualizados.
