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

## Menu da conta e identidade ativa (`src/components/account-menu.tsx`)

Menu do avatar no header, renderizado pelo `AccountMenu` do design system. Além dos atalhos da
conta, ele escolhe qual identidade o `/feed` usa: **social** ou **profissional**. A escolha fica
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

**Props:** `{ value, onChange, placeholder?, className?, maxLength?, rows? }`

**Funcionalidades:**

- Detecta padrão `@` + termo de busca
- Query na API de search de usuários (mínimo 2 caracteres)
- Dropdown de resultados com navegação por setas, Tab/Enter para selecionar, Escape para fechar
- Insere `@username` no texto e rastreia IDs dos mencionados
- Com `toolbar`, mostra o botão `Figurinhas`: o código escolhido (`KEKW`) entra no texto como
  palavra (ver abaixo)

## Figurinhas

`src/lib/emotes/` (`api`, `catalog`, `catalog-cache`, `use-emotes`) e
`src/components/emotes/emote-picker-dialog.tsx` (seletor). O texto gravado continua sendo o CÓDIGO —
a troca por imagem acontece na leitura (`useEmoteText` dentro do `RichText`), então quem edita vê
`KEKW`, não um endereço de imagem.

- **Catálogo:** é do BACKEND, não do navegador. O backend fala com o BTTV e o FrankerFaceZ de 3 em 3
  horas, junta tudo em memória e serve três rotas: `GET /emotes?page&limit&q` (página do seletor),
  `GET /emotes/index` (mapa código → imagem, que o texto usa) e `GET /emotes/image/{provedor}/{id}`
  (a imagem, por um cache próprio). O front só lê — abrir o seletor não faz o navegador falar com
  API de terceiro, e por isso não existe mais "Carregando figurinhas..." interminável. Detalhes do
  módulo em `enois-backend/docs/FIGURINHAS.md`.
- **Uma lista só:** `GET /emotes` já volta na ordem do seletor — as mais usadas primeiro, o resto em
  ordem alfabética —, sem aba nem filtro por provedor. Toda figurinha da lista existe no catálogo do
  backend, então a escolhida aparece igual no texto de quem lê.
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
