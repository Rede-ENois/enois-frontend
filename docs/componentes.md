# Componentes

## `PresenceIndicator` (`src/components/presence-indicator.tsx`)

A bolinha aparece junto ao nome no perfil e no post do feed. Para o titular, abre as
opções Disponível, Ausente, Não perturbar e Invisível. Para outras pessoas, mostra
somente o estado público. O heartbeat da área autenticada atualiza a atividade sem
modificar a escolha. O status de texto e ícone do perfil continua separado.

## `CosmeticShop` (`src/components/wallet/cosmetic-shop.tsx`)

The cosmetics shop in the `Loja` tab of `/carteira`, together with the community marketplace.
It is drawn by `CosmeticCatalog` (`src/components/wallet/cosmetic-catalog.tsx`), a copy of the
design system shop with one addition: the `Todas as coleções` tab. The published design system
only filters one collection per tab, so a seasonal tab used to hide the rest of the catalog —
**when the package ships that tab, `CosmeticCatalog` goes away and the wrapper points back at
`CosmeticShop` from the design system.**

- Reads `GET /loja` and `GET /loja/colecoes` (Zod-validated in `src/lib/api/loja.ts`); prices are
  formatted with `formatFaisca`, and each look shows the price of the pieces still missing
  (`lookPriceMf` in `src/lib/cosmetics.ts`: 75% of their sum, rounded to whole faíscas, the
  backend arithmetic)
- Opens on `Todas as coleções`: every item of every collection, including out-of-season ones
  (listed, tagged `Fora de temporada`, not sellable). The collection chips stay one click away,
  in-season first, then the classics, then the out-of-season collections
- Buy, buy look, equip and unequip invalidate `loja`, `carteira`, `profile`, `me` and `feed`;
  every API error code has its own pt-BR toast (`texts.cosmetics.errors`)
- The `saci` and `halloween` collections show the Saci × Halloween duel (`SaciDuelPanel`)
- The album of a collection only exists inside the collection tab (the catalog-wide tab has no
  album)

## `FrameShop` (`src/components/wallet/frame-shop.tsx`)

The owned frames in the `Minhas molduras` tab of `/carteira` (`onlyOwned`). It lists only the
`FRAME` items of the catalog.

**Props:** `{ onlyOwned?: boolean }`

- Search, filters, `oldest`/`newest` order (`GET /loja?order=`), pagination of 12 and the frame
  preview come from the design system `FrameShop`

## `ProfilePeek` (`src/components/profile/profile-peek.tsx`)

The avatar or name of a person in a list opens a popover with the design system
`ProfileMiniCard`. The public profile loads only when the popover opens (same query key as the
profile page), with loading and error states. Used in the network, feed suggestions, group
members, requests, posts and comments, community members, ranking and recommendations.
In posts and comments it comes through the design system `renderAuthorTrigger` prop; a corporate
post keeps the link to the professional profile.

## `ProfileStatusDialog` (`src/components/profile/profile-status-dialog.tsx`)

The owner's status bubble (`PUT /me/status`): up to 60 characters and an icon from the free
icons or the icons of owned official badges.

## `SaciSpot` and `SaciDuelBanner` (`src/components/events/`)

- `SaciSpot`: the hidden Saci of the hunt in one of the 7 spots (feed, vagas, comunidades, blog,
  carteira, mensagens, perfil), shown only while the hunt is active, for a signed-in person, and
  until that spot is found
- `SaciDuelBanner`: the duel on the feed while it is open; closing it hides it on the device

## `BadgeMediaProvider` (`src/components/badge-media-provider.tsx`)

The badge editors of the design system draw each badge with `<img src>`. Official badge ids
(`emblema-*`) become SVG data URLs; the renderer is loaded only when the list has one.

## `AppShell` (`src/components/app-shell.tsx`)

Layout principal da aplicação. Envolve todo o conteúdo das páginas autenticadas.

**Props:** `{ children: ReactNode }`

**Funcionalidades:**

- Header com logo "Conexão", `SearchBox`, `ThemeToggle`, sino de notificações, avatar do perfil
- Side menu (desktop, ≥ 1024px) in sections (you, community, work, explore) from
  `src/components/navigation-items.ts`; each item may carry a signal from `signalFor`
  (`src/lib/navigation-signals.ts`): unread messages as a balloon, pending requests as a count, and a
  soft news dot when the item's notification module (`notifies`) has unread notices. The counts come
  from one source: `GET /notifications/unread-summary`, the messages unread count and pending
  connection requests (`useNavigationCounts`).
  Eventos shows the amber "hoje" tag when the summary has `eventsToday`; Comunidades and each of
  the person's communities light the news dot from `byCommunity`. Notices that come from a place
  or an event carry `place` and `eventDate`, drawn as the community table or the event ticket.
- Phone menu button: a news dot when an entry behind the menu (not on the dock) has a signal
  (`useMenuHasNews`, `src/components/use-menu-has-news.ts`).
- Mobile dock (< 1024px, `src/components/mobile-dock.tsx`): Início, Explorar, Publicar
  (`/feed?compor=POST`), Mensagens and Avisos, with the same signals.
- Explorar (`src/routes/explorar.tsx`): lists only the rooms of the active interface plus the shared
  ones (`isOfInterface`): Trabalho appears in the professional interface, Brincar and Comunidade
  rooms in the social one. An empty section is left out. The menu switcher is the way across, so a
  tap in Explorar never switches the interface. The header bell shows only from `lg`; below it the
  dock carries Avisos.
- Drawer lateral de navegação (mobile/tablet, < 1024px) com os mesmos links
- Notices popover (`NotificationsPanel` from the DS, popover variant): unread rows first-class, read one, read all, accept/reject requests, and "Ver todos os avisos" to `/notificacoes`. Shares `useNotificationsPanel` with the full page.

O limite da navegação é 1024px (`lg`): abaixo, hambúrguer/drawer; a partir, sidebar.

**Estado:** `useQuery` para perfil, notificações; `useMutation` para marcar lidas

**Funções auxiliares:**

- `navigateToHref(href, navigate)` - Mapeia hrefs de notificações para rotas frontend
- `SearchBox()` - Input de busca global com debounce (250ms), resultados em popover, suporte mobile. App features come first (`matchFeatures`, `src/lib/feature-search.ts`: Explore rooms, menu entries of the active interface and account pages, accent-insensitive, skipping turned-off modules), drawn as places with their icon
- `formatTime(iso)` - Formata ISO timestamp para relativo em português

## Menu da conta e identidade ativa (`src/components/account-menu.tsx`)

Avatar menu in the header, drawn by the DS `AccountMenu`. It is kept to six entries: profile, wallet
(with the balance), account and security (`/conta`), support, the moderator panel (only for
moderators and admins, from `moderationApi.me()`) and logout, plus the light/dark `ThemeSwitch`.
Preferences (healthy usage, notification preferences, muted users, parental supervision, support us)
moved to `/conta`. Besides the account shortcuts, ele escolhe qual identidade o `/feed` usa: **social** ou **profissional**. A escolha fica
gravada no aparelho; fora do feed, o efeito visível é o toast de confirmação.

**Regras da troca:**

- A seção "Identidade" só aparece com o perfil profissional **`ACTIVE`**. Em `DRAFT` (rascunho) ou
  `DISABLED`, ela não é exibida — o controle ficaria desabilitado sem explicar o motivo. O item
  "Perfil profissional" do menu leva a `/profissional` para criar ou ativar o perfil.
- A escolha é gravada em `localStorage('connect-grow-active-identity')` (como o tema) e sincroniza
  entre abas pelo evento `storage` — ver `src/lib/active-identity.ts`.
- `effectiveIdentity()` faz o **fallback de leitura** para `SOCIAL` quando o perfil não existe ou
  não está ativo: a interface nunca exibe um perfil inativo. A preferência continua gravada — se o
  perfil voltar a ficar ativo, a identidade profissional volta a valer.
- Ao escolher, o menu fecha e um toast confirma a identidade ativa. No `/feed`, a identidade
  profissional deixa o compositor só com publicações `BUSINESS` (feed corporativo), removendo
  também os tipos de página e artigo da seleção; a social remove o `BUSINESS`.
- É conveniência de interface, **não autorização**: o backend decide a autoria de cada publicação e
  valida permissões em toda requisição.

## Sequência diária (`StreakCard` do design system)

- **Carteira** (`src/routes/carteira.tsx`): o cartão completo acima do extrato, com o `streak` que
  já vem em `/carteira` (sem pedido extra). Backend sem o campo não desenha nada.
- **Perfil, só do dono** (`src/components/profile/profile-gamification-panel.tsx`): o cartão
  completo logo abaixo do painel de presença, de `GET /me/streak`; visitante não vê nem busca.
- Nunca fica fixo no cabeçalho: sempre à vista, a sequência vira cobrança diária.
- `today` vem de `hojeNoApp()` (`src/lib/date/format.ts`), o dia no fuso do app, o mesmo em que o
  backend conta.

## Jogos diários: compartilhar o resultado

`DailyWord`, `DailyMaze` e `DailyBlocks` (`src/components/daily-*.tsx`) compartilham pelo
`useDailyShare` (`src/lib/daily-share.ts`): o texto vem do `buildDailyShareText` do design system
(sem a resposta nem o tabuleiro) e termina em `https://enois.ia.br/games?categoria=diarios`. Usa
`navigator.share` quando existe (fechar o menu é "idle", não erro); senão copia. O `shareStatus` volta
a "idle" depois de 3 s.

Em Palavras e Labirinto, a pessoa pode alternar entre hoje e o desafio de ontem enquanto uma
jogada aguarda resposta. O resultado atualiza o cache do desafio enviado, mesmo que outro esteja
aberto. Iniciar uma partida sempre atualiza hoje; confirmação de linha e erro de palpite aparecem
somente no desafio correspondente, sem apagar um rascunho digitado na outra data. Os testes
`daily-games-request-cache.test.tsx` cobrem as duas direções de troca, o início e a recusa de um
palpite (issue #532).

## `PostCard` (`src/components/post-card.tsx`)

Card de post no feed, com todas as ações sociais.

**Props:** `{ post: PostView }`

**Funcionalidades:**

- Cabeçalho com autor (avatar, nome, timestamp) e badge de tipo
- Conteúdo com linkify (@menções e URLs clicáveis)
- Grid de mídia (imagens com fullscreen, vídeo)
- Resumo de reações com emojis
- Tags
- Ações: reagir (popover com 8 emojis), comentar, salvar, compartilhar, denunciar
- Seção de comentários com replies encadeadas
- Comentários enviados mantêm a ordem cronológica usada no carregamento, inclusive nas respostas; fixados e respostas aceitas preservam seu destaque.
- Link previews + embeds de vídeo (YouTube, Vimeo, Dailymotion, Twitch)

**Componentes internos:**

- `ReactionsSummary()` - Sumário de reações com emojis e contagem
- `ReactionsDialog()` - Dialog listando usuários que reagiram
- `ReportDialog()` - Dialog de denúncia com motivo e descrição
- `CommentItem()` - Comentário individual com reply, reaction, delete
- `AuthorInfo()` - Cabeçalho do autor do post
- `EmbedPlayer()` - Player de vídeo embed com thumbnail e clique para play
- `LinkPreviews()` - Preview de links e vídeos no conteúdo
- `extractVideoId()` - Extrai plataforma e ID de URL de vídeo
- `linkifyText()` - Converte @menções e URLs em links
- `MediaGrid()` - Grid de mídia com fullscreen para imagens e player para vídeo
- `formatTime()` - Formata timestamp relativo

## `PostComments` (`src/components/post/post-comments.tsx`)

Nos comentários do feed (`PostComments`), o campo ocupa a largura toda no mobile. No rodapé, as ferramentas ficam à esquerda e o botão “Comentar” à direita, com estados desabilitado e enviando. Ao abrir as ferramentas pelo “+”, Foto, Áudio e GIF ficam na mesma linha entre o “+” e o envio. O envio fica só com o ícone e mantém seu nome acessível; ao fechar, o texto volta. Ambos os botões de envio usam o mesmo formulário; o desktop mantém o botão de ícone ao lado do campo. Anexos também podem ser enviados sem texto.

## `GroupPostItem` (`src/routes/grupos.$slug.tsx`)

Post do feed de um grupo, com reações, comentários e ações de moderação.

- Comentários: no mobile, o campo ocupa a linha toda e o rodapé põe o contador à esquerda e o botão
  à direita; em telas maiores, campo e botão ficam lado a lado e o contador volta à direita, abaixo
  do campo. O contador interno do `MentionTextarea` fica desativado nesse formulário, que renderiza
  o mesmo `CharCounter` no rodapé.

## `EditProfileDialog` (`src/components/edit-profile-dialog.tsx`)

Dialog multi-aba para edição completa do perfil.

**Props:** `{ profile: Profile, children: ReactNode }`

**Abas:**

1. **Informações** - Nome, username, headline, bio, empresa, localização, disponibilidade, portfólio, links externos, habilidades, objetivos, openToWork, isMentor
2. **Experiências** - CRUD com formulário dinâmico (cargo, empresa, local, descrição, datas, "atualmente aqui")
3. **Educação** - CRUD (instituição, grau, campo, descrição, datas)
4. **Certificações** - CRUD (nome, emissor, descrição, datas, URL)

**Componentes internos:**

- `Field()` - Wrapper de campo com label e erro
- `SubList()` - Componente genérico de CRUD para listas aninhadas. Antes de salvar, valida com
  `subListErrors` (no design system, `src/domain/profile/sub-list-errors.ts`): campos obrigatórios, data que o
  navegador recusou (ex.: 31/11) e, nas listas com "atualmente aqui", data de fim quando o item foi
  encerrado — o backend deriva "atual" de `endDate == null` e não lê `currentlyHere`. Erro da API
  aparece no formulário, que só fecha quando salvou.

## `ImageCropDialog` (`@rede-enois/design-system/patterns`)

Dialog de corte de imagem (`react-easy-crop`). Mora no design system
(`src/patterns/editor/image-crop-dialog.tsx` do repositório `enois-design-system`); props e
variações estão no Storybook de lá.

## `MentionTextarea` (`src/components/mention-textarea.tsx`)

Textarea com autocomplete de @menções.

**Props:** `{ value, onChange, placeholder?, className?, maxLength?, showCounter?, rows? }`

**Funcionalidades:**

- Detecta padrão `@` + termo de busca
- Query na API de search de usuários (mínimo 2 caracteres)
- Dropdown de resultados com navegação por setas, Tab/Enter para selecionar, Escape para fechar
- Insere `@username` no texto e rastreia IDs dos mencionados
- Mostra o contador interno quando há `maxLength`, exceto se `showCounter={false}` (padrão `true`)
- Com `toolbar`, mostra o botão `Figurinhas`: o código escolhido entra no texto como `:KEKW:`
  (ver abaixo)
- A inserção de figurinha passa pelo evento de edição do próprio campo. O design system mantém
  os IDs apenas das menções confirmadas que continuam no texto, inclusive depois de limpar o
  rascunho ou substituir uma menção pela figurinha; o wrapper não guarda outra lista de IDs
  ([#534](https://github.com/Rede-ENois/enois-frontend/issues/534)).

## Figurinhas

`src/lib/emotes/` (`api`, `catalog`, `catalog-cache`, `use-emotes`) e
`src/components/emotes/emote-picker-dialog.tsx` (seletor). O texto gravado continua sendo o CÓDIGO —
a troca por imagem acontece na leitura (`useEmoteText` dentro do `RichText`), então quem edita vê
`:KEKW:`, não um endereço de imagem.

- **Formato `:codigo:`** ([#556](https://github.com/Rede-ENois/enois-frontend/issues/556)): só
  `:KEKW:` vira figurinha, para uma palavra comum que também é código ("Pedro") continuar sendo
  palavra. Texto escrito antes do corte (`BARE_EMOTE_CODES_UNTIL` em `src/lib/emotes/catalog.ts`,
  03/11/2026) também troca o código solto, para post antigo continuar como o autor viu: quem desenha
  passa a data do texto em `RichText writtenAt` (post, comentário, mensagem, post e comentário de
  grupo, artigo e post de blog). Sem `writtenAt` (bio, descrições), só vale `:codigo:`.

- **Catálogo:** é do BACKEND, não do navegador. O backend fala com o BTTV e o FrankerFaceZ de 3 em 3
  horas, junta tudo em memória e serve três rotas: `GET /emotes?page&limit&q` (página do seletor),
  `GET /emotes/index` (mapa código → imagem, que o texto usa) e `GET /emotes/image/{provedor}/{id}`
  (a imagem, por um cache próprio). O front só lê — abrir o seletor não faz o navegador falar com
  API de terceiro, e por isso não existe mais "Carregando figurinhas..." interminável. Detalhes do
  módulo em `enois-backend/docs/FIGURINHAS.md`.
- **Uma lista só:** `GET /emotes` já volta na ordem do seletor — as mais usadas primeiro, o resto em
  ordem alfabética —, sem filtro por provedor. Toda figurinha da lista existe no catálogo do
  backend, então a escolhida aparece igual no texto de quem lê.
- **Recentes** ([#555](https://github.com/Rede-ENois/enois-frontend/issues/555)): as últimas 24
  figurinhas escolhidas no seletor ficam no `localStorage` deste aparelho
  (`rede:emotes:recent:v1`, só os códigos; `src/lib/emotes/recent-emotes.ts`). Com algo salvo, o
  seletor abre na aba "Recentes" e a lista do backend vira a aba "Todas"; digitar na busca sempre
  mostra a lista completa. A imagem vem do índice, então código que saiu do catálogo some sozinho.
- **Paginação:** uma página de 40 por vez (`EMOTES_POR_PAGINA` em `src/lib/emotes/use-emotes.ts`),
  pedida ao backend a cada clique. A resposta anterior fica na tela (`placeholderData`) enquanto a
  nova chega, e a busca é debounced (250 ms) antes de virar `q`.
- **Cache:** o índice vai para o `localStorage` (`rede:emotes:index:v3`) e entra como dado inicial do
  react-query, para o primeiro quadro já desenhar figurinha. O que vem do armazenamento é revalidado
  entrada por entrada — só passa código válido e caminho do proxy de imagens.
- **Animação:** decidida no catálogo do backend; o caminho da imagem carrega `&a=1` quando a
  figurinha tem versão em movimento, então o cache do navegador não mistura animada com estática. Na
  grade o seletor usa a miniatura (`variant=thumb`), que nunca é animada.
- **Endereço da imagem:** `emoteImageUrl` prefixa o caminho com a base da API (`apiUrl`). Em produção
  a API mora em outro host, então `isOwnMediaUrl` (`src/lib/api/media.ts`) libera o host da API
  explicitamente — sem isso a figurinha viraria link no texto.
- **Tamanho no chat:** `src/styles.css` casa pelo caminho `/emotes/image/` e dá a toda figurinha a
  mesma caixa quadrada de 28px com `object-fit: contain` (os CDNs dos provedores continuam na regra
  para texto antigo).
- **Procedência e crédito:** as artes não são nossas. O BetterTTV e o FrankerFaceZ **não** licenciam
  os emotes sob Creative Commons — os termos dos dois proíbem copiar, hospedar ou redistribuir sem
  autorização expressa (FFZ: "users are forbidden from downloading, hosting, modifying, or
  redistributing content hosted on FFZ servers without explicit permission from both FFZ and the
  original owner(s)"; BetterTTV: "You may not distribute, modify, transmit, reuse, download, repost,
  copy, or use said Content… for commercial purposes or for personal gain, without express advance
  written permission"), e o uso da API do FFZ por aplicação não ligada ao Twitch também depende de
  permissão. Por isso o rodapé da landing declara a origem (`texts.landing.footer.emotesTitle` /
  `emotes`) e oferece a via de remoção pela página de contato; os Termos de Uso têm a seção
  "15. Figurinhas de terceiros". O aviso não substitui a autorização dos provedores: enquanto ela não
  existir, o uso é acessório e não comercial, sem venda nem licenciamento das imagens.

## `UserAvatar` (`@rede-enois/design-system/domain`)

Avatar reutilizável. Mora no design system (`src/domain/avatar/user-avatar.tsx` do repositório
`enois-design-system`); props e variações estão no Storybook de lá.

## `ThemeToggle` (`src/components/theme-toggle.tsx`)

Alternador de tema claro/escuro/sistema.

**Funcionalidades:**

- Cicla: light → dark → system → light
- Persiste em `localStorage('connect-grow-theme')`
- Aplica classe `dark` no `<html>`
- Escuta mudanças do sistema (`prefers-color-scheme`)

**Funções auxiliares:**

- `getSystemTheme()` - Detecta preferência do sistema
- `applyTheme(theme)` - Aplica tema ao DOM

## `useIsMobile` (`src/hooks/use-mobile.tsx`)

Hook para detectar breakpoint mobile (< 768px).

**Retorno:** `boolean`

## Componentes UI (shadcn/ui)

46 componentes em `src/components/ui/` gerados pelo shadcn:

| Componente     | Descrição                                                               |
| -------------- | ----------------------------------------------------------------------- |
| Accordion      | Acordeão expansível                                                     |
| Alert          | Alertas                                                                 |
| AlertDialog    | Dialog de confirmação                                                   |
| AspectRatio    | Container com proporção                                                 |
| Avatar         | Avatar com fallback                                                     |
| Badge          | Badge/tag                                                               |
| Breadcrumb     | Navegação breadcrumb                                                    |
| Button         | Botão (variants: default, secondary, outline, ghost, destructive, link) |
| Calendar       | Calendário (date-fns)                                                   |
| Card           | Card com header/content/footer                                          |
| Carousel       | Carrossel (Embla)                                                       |
| Chart          | Gráficos (Recharts)                                                     |
| Checkbox       | Checkbox                                                                |
| Collapsible    | Painel colapsável                                                       |
| Command        | Paleta de comandos (cmdk)                                               |
| ContextMenu    | Menu de contexto                                                        |
| Dialog         | Dialog modal                                                            |
| Drawer         | Drawer mobile (Vaul)                                                    |
| DropdownMenu   | Menu dropdown                                                           |
| Form           | Formulários (react-hook-form)                                           |
| HoverCard      | Card ao hover                                                           |
| Input          | Input de texto                                                          |
| InputOTP       | Input de código OTP                                                     |
| Label          | Label de formulário                                                     |
| Menubar        | Barra de menu                                                           |
| NavigationMenu | Menu de navegação                                                       |
| Pagination     | Paginação                                                               |
| PasswordInput  | Campo de senha com botão de mostrar/ocultar alinhado à caixa            |
| Popover        | Popover                                                                 |
| Progress       | Barra de progresso                                                      |
| RadioGroup     | Grupo de radio buttons                                                  |
| Resizable      | Painéis redimensionáveis                                                |
| ScrollArea     | Área com scroll customizado                                             |
| Select         | Select dropdown                                                         |
| Separator      | Separador visual                                                        |
| Sheet          | Sheet lateral                                                           |
| Sidebar        | Sidebar (shadcn)                                                        |
| Skeleton       | Skeleton loader                                                         |
| Slider         | Slider de intervalo                                                     |
| Sonner         | Toasts (sonner)                                                         |
| Switch         | Toggle switch                                                           |
| Table          | Tabela                                                                  |
| Tabs           | Abas                                                                    |
| Textarea       | Textarea                                                                |
| Toggle         | Botão toggle                                                            |
| ToggleGroup    | Grupo de toggles                                                        |
| Tooltip        | Tooltip                                                                 |

## Emblemas dos selos de contribuição

Cada nível de selo de contribuição tem um emblema fixo em `public/seals/<emblema>.png` (256×256,
fundo transparente): `ajudante`, `contribuinte-serio`, `hardcore`, `tryhard`, `get-a-life`,
`beta-tester`, `exigente`, `esforco-maximo`, `plus-ultra`, `genkidama`. O nome vem do campo `emblem`
que a API devolve em `/users/{username}/seals` e `/seals/criteria`; `sealEmblemSrc`
(`src/lib/seal-emblem.ts`) valida o nome e monta a URL. O emblema aparece em `/selos` (cada nível) e
no cartão do selo no perfil (`ProfileSeals`, via `emblemSrc` do design system). Não há escolha de
emblema: ele é consequência do nível calculado pelo backend. Regras em `docs/CONTRIBUTION_SEALS.md`
do backend.

## Feed scroll probe

`VirtualizedFeedList` carries an opt-in probe for people who see the feed jump. Opening
`/feed?debug=scroll` turns it on for the browser session (`lib/feed/scroll-debug`): it records every
card that changes height (post id, old and new height, scroll before and after), scroll jumps over
150px in one event and every change of the post list. A "Copiar relatório de rolagem" button copies
the device line plus the last 800 entries to paste in a chat. Off by default; the virtualizer's own
resize runs untouched, the probe only reads around it. No personal data goes in the report.
