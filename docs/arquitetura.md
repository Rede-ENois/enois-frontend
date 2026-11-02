# Arquitetura

## Visão Geral

O Connect-Grow é uma SPA (Single Page Application) com SSR (Server-Side Rendering) opcional. O frontend React se comunica com um backend Java/Kotlin hospedado em `https://rede.fly.dev` via API REST.

## Fluxo de Requisição

```
Browser → Vite Dev Server (proxy /api) → Backend Java/Kotlin
                                    ou (produção)
Browser → Nitro SSR → Backend Java/Kotlin
```

## Camadas da Aplicação

### 1. Entry Point (`src/server.ts`)

Ponto de entrada do servidor SSR. Importa o módulo `@tanstack/react-start/server-entry`, captura erros catastróficos do h3 e renderiza uma página de erro amigável quando necessário.

**Principais funções:**

- `getServerEntry()` - Lazy-load do módulo server entry do TanStack Start
- `normalizeCatastrophicSsrResponse()` - Detecta respostas HTTP 500 do h3 que engoliram erros originais e substitui por página de erro
- `default.fetch()` - Handler principal que orquestra SSR com tratamento de erro

### 2. TanStack Start (`src/start.ts`)

Cria a instância do TanStack Start com middleware de erro que captura exceções não tratadas em server functions e renderiza a página de erro.

### 3. Router (`src/router.tsx`)

Configura o TanStack Router com:

- QueryClient do TanStack Query
- Restauração de scroll
- Preload padrão

### 4. Rota Raiz (`src/routes/__root.tsx`)

Fornece:

- **QueryClientProvider** para toda a aplicação
- **OAuthCallbackHandler** - captura tokens OAuth da URL e armazena no localStorage
- **Head meta tags** globais (charset, viewport, SEO, Open Graph)
- **404** (`NotFoundComponent`) e **Error Boundary** (`ErrorComponent`)
- **RootShell** - HTML shell com `<head>` e `<body>`

### 5. Layout Principal (`src/components/authenticated-app-container.tsx`)

Layout que envolve todas as páginas autenticadas:

- **Header sticky** com logo, busca global, toggle de tema, notificações e avatar do perfil
- **Sidebar de navegação** (desktop, ≥ 1024px) com links para feed, rede, comunidades, mensagens, vagas, mentoria, eventos, salvos
- **Drawer lateral de navegação** (mobile/tablet, < 1024px) com os mesmos links
- **Notificações** em popover com lista, marcação de lidas, e ação "Aceitar" para convites

O limite da navegação é único: 1024px (`lg`). Abaixo dele o menu abre pelo hambúrguer (drawer); a partir dele, a sidebar fica visível.

### 6. Gerenciamento de Estado

- **TanStack Query** para todo estado de servidor (cache, refetch, mutations)
- **localStorage** para sessão (session_token, refresh_token, current_user)
- **Estado local (useState)** para UI components (modais, abas, formulários)

As consultas compartilhadas ficam em `src/lib/query-options/` por domínio. A chave inclui os
parâmetros que alteram a resposta, como os limites de comunidades próprias e de convites da rede.
Projetos pessoais de perfil e projetos comunitários têm identidades diferentes; operações de cache
reutilizam as chaves ou os prefixos dessas definições. A carteira usa a mesma consulta no perfil e
na página da carteira. A edição de empresa invalida o detalhe, as empresas próprias e os filtros do
diretório. Consultas de perfil por ID compartilham a definição individual, inclusive nos diálogos.
A consulta de aviso ativo converte a resposta sem conteúdo em `null`, um resultado válido para o
TanStack Query.

Condições de interface, polling e exceções de frescor continuam nos consumidores. Loaders de SSR,
revalidação de dados associados à sessão e paginação por cursor conservam suas regras próprias.

### 7. Autenticação

Fluxo:

1. Usuário faz login/signup → backend retorna token + refreshToken
2. Tokens salvos no localStorage
3. Toda requisição autenticada envia `X-Session-Token` no header
4. Se 401/403, tenta refresh automático com `refresh_token`
5. Se refresh falhar, limpa sessão e redireciona para `/entrar`

### 8. Padrão de API

Cada módulo da API (`src/lib/api/*.ts`) segue o padrão:

- Define interfaces TypeScript para request/response
- Exporta um objeto com métodos que chamam `api.get/post/put/patch/delete`
- Usa `buildQuery()` para paginação por cursor
- Mutations usam `Idempotency-Key` para evitar duplicatas

### 9. Upload de Mídia

Fluxo em 3 etapas:

1. Solicita URL de upload via `POST /api/media/uploads`
2. Obtém autenticação ImageKit via server function (`getImageKitAuth`)
3. Envia arquivo diretamente para ImageKit CDN

### 10. Tratamento de Erros

- **Erros de API**: classe `ApiError` com status, code e message
- **Erros SSR**: capturados por `error-capture.ts` e renderizados por `error-page.ts`
- **Error Boundary React**: `ErrorComponent` na rota raiz
- **Lovable Error Reporting**: integração opcional para reportar erros no client

## Dependências Principais

| Dependência            | Uso                     |
| ---------------------- | ----------------------- |
| react, react-dom 19    | UI                      |
| @tanstack/react-query  | Cache server-side       |
| @tanstack/react-router | Roteamento SPA          |
| @tanstack/react-start  | SSR + Server Functions  |
| tailwindcss 4          | Estilização             |
| shadcn/ui (Radix)      | Componentes de UI       |
| react-hook-form + zod  | Formulários e validação |
| react-easy-crop        | Crop de imagens         |
| lucide-react           | Ícones                  |
| sonner                 | Toasts                  |
| date-fns               | Formatação de datas     |
| recharts               | Gráficos                |
| vaul                   | Drawers mobile          |
| embla-carousel-react   | Carrosséis              |
