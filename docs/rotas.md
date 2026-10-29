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
- **Abas de filtro:** Para você, Tudo, Seguindo, Discussões, Projetos
- **Feed infinito** de `PostCard` components
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
- Dialog de criação de comunidade (nome, descrição, tópico)

**Componentes auxiliares:**

- `CreateCommunityDialog()` - Dialog de criação

## `/comunidades/$communityId` - Detalhe da Comunidade (`src/routes/comunidades.$communityId.tsx`)

**Auth:** Obrigatória

**Loader:** Busca dados da comunidade, `notFound` se não existir

**Componente:** `CommunityDetail()`

- Cover, avatar, nome, descrição, tópico, membros
- Botão Entrar/Sair
- Admin pode editar (nome, descrição, cover, avatar com crop)
- Feed da comunidade com posts (membros podem postar)
- Lista de membros na sidebar

**Componentes auxiliares:**

- `EditCommunityForm()` - Formulário de edição da comunidade

## `/eventos` - Eventos (`src/routes/eventos.tsx`)

**Auth:** Obrigatória

**Componente:** `Eventos()`

- Grid de cards de eventos
- Card com data, formato (Online/Presencial/Híbrido), título, host, participantes
- Botão "Confirmar presença" / "Desconfirmar presença"; card marcado com "Você vai" quando `attending`
- Dialog de criação de evento (título, data, hora, realizador, formato)

**Componentes auxiliares:**

- `CreateEventForm()` - Formulário de criação de evento
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
- Solicitações pendentes (recebidas e enviadas) com aceitar/rejeitar/cancelar
- Grid de sugestões de conexão com avatar, nome, headline, interesses em comum
- Botão Conectar/Remover

**Componentes auxiliares:**

- `RequestCard()` - Card de solicitação de conexão
- `Stat()` - Card de estatística

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

| Rota                             | Arquivo                                          | Descrição                                                                     |
| -------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `/apoiar`                        | `apoiar.tsx`                                     | Página de apoio com Pix (BR Code gerado no cliente) e carta do manifesto.     |
| `/auth/callback`                 | `auth.callback.tsx`                              | Callback de OAuth (Google/Apple/LinkedIn) e 2FA federado.                     |
| `/auth/redefinir`                | `auth.reset.tsx`                                 | Redefinição de senha por token de e-mail.                                     |
| `/auth/verificar`                | `auth.verify.tsx`                                | Verificação de e-mail do cadastro (token do link).                            |
| `/blog/:username`                | `blog.$username.tsx`                             | Blog de um usuário.                                                           |
| `/blog/:username/:postId`        | `blog.$username_.$postId.tsx`                    | Post de blog público (com assinatura).                                        |
| `/blog/post/:postId`             | `blog.post.$postId.tsx`                          | Post por id (compartilhamento).                                               |
| `/blog/post/novo`                | `blog.post.new.tsx`                              | Editor de post de blog.                                                       |
| `/blogs`                         | `blogs.tsx`                                      | Catálogo de blogs.                                                            |
| `/bloqueados`                    | `bloqueados.tsx`                                 | Lista de usuários bloqueados (desbloquear).                                   |
| `/carteira`                      | `carteira.tsx`                                   | Carteira em faíscas: saldo, transferências, contestações.                     |
| `/comunidades`                   | `comunidades.tsx`                                | Catálogo de comunidades.                                                      |
| `/comunidades/:id`               | `comunidades.$communityId.tsx`                   | Página da comunidade (posts, membros, regras).                                |
| `/comunidades/:id/canais/:canal` | `comunidades.$communityId.canais.$channelId.tsx` | Canal privado de uma comunidade; acessível somente a membros.                 |
| `/contato`                       | `contato.tsx`                                    | Contato com o time (abre ticket de suporte).                                  |
| `/denuncias`                     | `denuncias.tsx`                                  | Minhas denúncias e seus estados.                                              |
| `/developers`                    | `developers.tsx`                                 | Portal de desenvolvedores da API pública (catálogo + casos de uso).           |
| `/diretrizes`                    | `diretrizes.tsx`                                 | Diretrizes da comunidade.                                                     |
| `/empresa/:slug`                 | `empresa.$slug.tsx`                              | Página pública da empresa.                                                    |
| `/empresas`                      | `empresas.tsx`                                   | Catálogo de empresas (derivado de vagas) e painel de edição.                  |
| `/entrar`                        | `entrar.tsx`                                     | Login e cadastro (e-mail + social + 2FA).                                     |
| `/eventos`                       | `eventos.tsx`                                    | Catálogo de eventos com RSVP.                                                 |
| `/feed`                          | `feed.tsx`                                       | Feed principal: compositor, abas, feed infinito, sidebar.                     |
| `/freelances`                    | `freelances.tsx`                                 | Freelances; visitante vê o aviso e o botão de candidatura.                    |
| `/games`                         | `games.tsx`                                      | Catálogo de jogos da comunidade.                                              |
| `/games/:username`               | `games.$username.tsx`                            | Página de criador de jogos.                                                   |
| `/games/:username/:gameSlug`     | `games.$username.$gameSlug.tsx`                  | Página pública de um jogo (jogar no sandbox).                                 |
| `/games/painel`                  | `games.painel.tsx`                               | Painel do criador: publicar/editar jogo, novidades, analíticos.               |
| `/grupos`                        | `grupos.tsx`                                     | Catálogo de grupos.                                                           |
| `/grupos/:slug`                  | `grupos.$slug.tsx`                               | Página do grupo (posts, membros, tópicos).                                    |
| `/`                              | `index.tsx`                                      | Landing page pública.                                                         |
| `/jogos-diarios`                 | `jogos-diarios.tsx`                              | Jogos diários com recompensa em faíscas.                                      |
| `/marketplace`                   | `marketplace.tsx`                                | Marketplace de itens digitais (compra com escrow).                            |
| `/mensagens`                     | `mensagens.tsx`                                  | Mensagens diretas (conversas, exclusão para mim).                             |
| `/mentoria`                      | `mentoria.tsx`                                   | Mentorias com agendamento.                                                    |
| `/meus-servicos`                 | `meus-servicos.tsx`                              | Painel de gerenciar serviços (ofertas, contratos).                            |
| `/moderacao`                     | `moderacao.tsx`                                  | Fila de recursos de penalidades e votação de punição.                         |
| `/moderacao/:reportId`           | `moderacao.$reportId.tsx`                        | Decisão de recurso/fila filha da moderação.                                   |
| `/moderador`                     | `moderador.tsx`                                  | Painel do moderador: todas as filas + monitoramento (candidatura é só admin). |
| `/penalidades`                   | `penalidades.tsx`                                | Minhas penalidades e recursos.                                                |
| `/perfil/:username`              | `perfil.$username.tsx`                           | Perfil público (posts fixados, ranking de chegada, projetos).                 |
| `/perfil`                        | `perfil.index.tsx`                               | Meu perfil (redireciona/edição).                                              |
| `/post/:postId`                  | `post.$postId.tsx`                               | Post individual (compartilhamento público).                                   |
| `/privacidade`                   | `privacidade.tsx`                                | Política de privacidade.                                                      |
| `/profissional`                  | `profissional.tsx`                               | Perfil profissional (edição).                                                 |
| `/profissional/:username`        | `profissional_.$username.tsx`                    | Perfil profissional público.                                                  |
| `/projetos/:username`            | `projetos.$username.tsx`                         | Projetos de um usuário.                                                       |
| `/projetos/:username/:slug`      | `projetos.$username.$projectSlug.tsx`            | Página de projeto da comunidade.                                              |
| `/projetos`                      | `projetos.index.tsx`                             | Catálogo de projetos da comunidade.                                           |
| `/projetos/painel`               | `projetos.painel.tsx`                            | Painel de projetos (criar/editar, fila de revisão).                           |
| `/rede`                          | `rede.tsx`                                       | Minha rede (conexões, sugestões).                                             |
| `/responsavel`                   | `responsavel.tsx`                                | Fluxo de responsável parental (ECA).                                          |
| `/salvos`                        | `salvos.tsx`                                     | Posts salvos.                                                                 |
| `/seguranca`                     | `seguranca.tsx`                                  | Segurança da conta: senha, 2FA, sessões, contas vinculadas.                   |
| `/servicos`                      | `servicos.tsx`                                   | Catálogo de serviços (contratar).                                             |
| `/sobre`                         | `sobre.tsx`                                      | Sobre o projeto.                                                              |
| `/suporte`                       | `suporte.tsx`                                    | Central de suporte (tickets, FAQ).                                            |
| `/termos`                        | `termos.tsx`                                     | Termos de uso.                                                                |
| `/vagas`                         | `vagas.tsx`                                      | Catálogo de vagas com busca booleana.                                         |
| `/vagas/:jobId`                  | `vagas.$jobId.tsx`                               | Detalhe da vaga (candidatar, salvar).                                         |
| `/vagas/:jobId/candidaturas`     | `vagas.$jobId.candidaturas.tsx`                  | Candidaturas da vaga (painel do contratante).                                 |
| `/vagas/minhas`                  | `vagas.minhas.tsx`                               | Minhas vagas (publicadas e candidaturas).                                     |

## Nametag do perfil profissional

O `:username` de `/profissional/:username` é o **nametag** do perfil profissional: ele é o `@` e o
fim da URL pública, tem namespace próprio no backend e pode ser diferente do `@` social (ex.:
`aminadojava` no social e `melsantos` no profissional). É editável em `/profissional`, num campo
com ação própria (não espera o resto do formulário); o formato é validado em
`src/lib/corporate/nametag.ts`, o mesmo do backend. Trocar o nametag muda o endereço público — o
antigo deixa de responder — sem tocar no perfil social.
