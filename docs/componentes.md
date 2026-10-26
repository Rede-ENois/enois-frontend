# Componentes

## `FrameShop` (`src/components/wallet/frame-shop.tsx`)

Loja de molduras de avatar na rota `/carteira`.

**Props:** `{ onlyOwned?: boolean }`

**Funcionalidades:**

- Abas Carteira, Loja e Minhas molduras com ícones; a rota abre na aba Carteira
- Busca por nome e descrição, filtros Todas, Simples e Animadas
- Ordenação por mais antigas (padrão) ou mais novas, preservada ao buscar e filtrar
- Ordenação solicitada à API por `GET /loja?order=oldest|newest`, baseada no campo
  `releaseOrder` do catálogo; resposta validada antes da exibição
- Paginação de 12 itens com botão "Mostrar mais molduras"
- Prévia da moldura no avatar e no perfil
- Compra, equipar e desequipar pelos contratos existentes de `POST /loja/{itemId}/comprar` e
  `POST /loja/{itemId}/equipar`

**Estado:** `useQuery` para catálogo; `useMutation` para comprar e equipar; estado local para
busca, filtro, ordenação, quantidade visível e prévia selecionada

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

**Props:** `{ value, onChange, placeholder?, className?, maxLength?, rows? }`

**Funcionalidades:**

- Detecta padrão `@` + termo de busca
- Query na API de search de usuários (mínimo 2 caracteres)
- Dropdown de resultados com navegação por setas, Tab/Enter para selecionar, Escape para fechar
- Insere `@username` no texto e rastreia IDs dos mencionados

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
