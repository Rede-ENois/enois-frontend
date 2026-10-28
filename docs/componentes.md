# Componentes

## `CosmeticShop` (`src/components/wallet/cosmetic-shop.tsx`)

Seasonal cosmetics shop in the `Loja` tab of `/carteira`, drawn by the design system
`CosmeticShop`.

- Reads `GET /loja` and `GET /loja/colecoes` (Zod-validated in `src/lib/api/loja.ts`); prices are
  formatted with `formatFaisca`, and each look shows the price of the pieces still missing
  (`lookPriceMf` in `src/lib/cosmetics.ts`: 75% of their sum, rounded to whole faíscas, the
  backend arithmetic)
- Buy, buy look, equip and unequip invalidate `loja`, `carteira`, `profile`, `me` and `feed`;
  every API error code has its own pt-BR toast (`texts.cosmetics.errors`)
- The `saci` and `halloween` collections show the Saci × Halloween duel (`SaciDuelPanel`)

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
- Sidebar de navegação (desktop, ≥ 1024px, 9 links) com destaque para rota ativa
- Drawer lateral de navegação (mobile/tablet, < 1024px) com os mesmos links
- Popover de notificações com: lista, contador de não lidas, botão "Marcar lidas", ação "Aceitar" em convites

O limite da navegação é 1024px (`lg`): abaixo, hambúrguer/drawer; a partir, sidebar.

**Estado:** `useQuery` para perfil, notificações; `useMutation` para marcar lidas

**Funções auxiliares:**

- `navigateToHref(href, navigate)` - Mapeia hrefs de notificações para rotas frontend
- `SearchBox()` - Input de busca global com debounce (250ms), resultados em popover, suporte mobile
- `formatTime(iso)` - Formata ISO timestamp para relativo em português

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
- `SubList()` - Componente genérico de CRUD para listas aninhadas

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
- Com `toolbar`, mostra o botão `Figurinhas`: o código escolhido (`KEKW`) entra no texto como
  palavra (ver abaixo)

## Figurinhas globais (BTTV + FrankerFaceZ)

`src/lib/emotes/` (catálogo, cache, paginação) e `src/components/emotes/emote-picker-dialog.tsx`
(seletor). O texto gravado continua sendo o CÓDIGO — a troca por imagem acontece na leitura
(`useEmoteText` dentro do `RichText`), então quem edita vê `KEKW`, não um endereço de CDN.

- **Catálogo:** as duas APIs públicas são chamadas pelo navegador (`fetch`), sem passar pelo
  backend. Hoje são 78 figurinhas globais (65 do BTTV + 13 do FFZ; o código repetido fica com o
  BTTV). Do FFZ só entram os `default_sets` — os outros sets da resposta não são a coleção global.
  O `top`/`trending` do BTTV exige chave de API (responde 403 sem ela).
- **Cache:** o catálogo montado vai para o `localStorage` (`rede:emotes:global`) e entra como dado
  inicial do react-query. O JSON do FFZ responde `cache-control: private, must-revalidate`, então
  sem essa cópia toda visita pagava a ida à API antes de desenhar figurinha nenhuma. O que vem do
  armazenamento é revalidado item por item antes de virar imagem.
- **Animação:** GIF do BTTV (`/emote/{id}/1x.gif`) e WebP animado do FFZ
  (`/emote/{id}/animated/{escala}`, campo `animated` da API) quando o provedor publica a versão em
  movimento; estático continua `2x.png` / `urls["2"]`. Na grade do seletor a figurinha do BTTV usa
  o PNG de 1x mesmo quando é animada — GIF de ~300KB na grade é o que deixava o seletor lento.
- **Grade:** `preview` (escala 1x) em páginas de 40 (`EMOTES_POR_PAGINA` em
  `src/lib/emotes/pagination.ts`), com busca e filtro por provedor voltando para a página 1.
- **Tamanho no chat:** `src/styles.css` casa pelo HOST do CDN (`cdn.betterttv.net`,
  `cdn.frankerfacez.com`) e dá a toda figurinha a mesma caixa quadrada de 28px com
  `object-fit: contain`. O seletor antigo só conhecia o caminho `/emoticon/` do FFZ, que a API não
  usa mais (`/emote/{id}/...`), e por isso as figurinhas do FFZ saíam no tamanho original.

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
