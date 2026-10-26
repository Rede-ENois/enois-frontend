# Documentação do Connect-Grow (Conexão)

Plataforma de networking profissional focada em conexões humanas autênticas, mentoria, comunidades, vagas e eventos.

## Stack

- **React 19** com TypeScript
- **TanStack Start** (SSR) + **TanStack Router**
- **TanStack Query** (cache e estado servidor)
- **Tailwind CSS 4** + **shadcn/ui**
- **Vite 7** (bundler)
- **Nitro** (deploy SSR)
- Backend em Java, servido por `https://enois.ia.br/api` (o proxy de dev aponta para ele)

## Índice da Documentação

| Documento                                  | Descrição                               |
| ------------------------------------------ | --------------------------------------- |
| [Arquitetura](arquitetura.md)              | Visão geral da arquitetura do projeto   |
| [Rotas](rotas.md)                          | Todas as rotas/páginas da aplicação     |
| [Componentes](componentes.md)              | Todos os componentes React              |
| [API - Módulos](api-modulos.md)            | Módulos de API e cliente HTTP           |
| [Modelos de Dados](modelos-de-dados.md)    | Interfaces e tipos do sistema           |
| [Configuração](configuracao.md)            | Arquivos de configuração do projeto     |
| [Integração de jogos](jogos-integracao.md) | Jogos externos no player do Énóis Games |

## Scripts

```bash
npm run dev      # Inicia ambiente local
npm run build    # Build de produção
npm run preview  # Serve build localmente
npm run lint     # ESLint
npm run format   # Prettier
```

## Requisitos

- Node.js >= 22.12
- npm

## Estrutura de Diretórios

```
src/
├── server.ts                    # Entry point SSR
├── start.ts                     # TanStack Start instance
├── router.tsx                   # Configuração do router
├── routeTree.gen.ts             # Árvore de rotas (gerada)
├── styles.css                   # Tailwind + variáveis CSS
├── components/                  # Componentes React
│   ├── app-shell.tsx            # Layout principal
│   ├── edit-profile-dialog.tsx  # Edição de perfil
│   ├── mention-textarea.tsx     # Textarea com @menções
│   ├── post-card.tsx            # Card de post
│   ├── theme-toggle.tsx         # Alternador de tema
│   └── …                        # primitivas de UI: @rede-enois/design-system/ui
├── hooks/
│   └── use-mobile.tsx           # Hook de breakpoint mobile
├── lib/
│   ├── api-client.ts            # Cliente HTTP core
│   ├── config.server.ts         # Config server-side
│   ├── error-capture.ts         # Captura de erros SSR
│   ├── error-page.ts            # Página de erro SSR
│   ├── lovable-error-reporting.ts
│   ├── mock-data.ts             # Dados mock (fallback)
│   ├── require-auth.ts          # Guard de autenticação
│   ├── use-auth.ts              # Hook de autenticação
│   ├── use-media-upload.ts      # Hook de upload
│   ├── utils.ts                 # Utilitário cn()
│   └── api/                     # 19 módulos de API
└── routes/                      # 12 rotas da aplicação
    ├── __root.tsx               # Rota raiz
    ├── index.tsx                # Landing page
    ├── feed.tsx                 # Feed principal
    ├── entrar.tsx               # Login/Signup
    ├── comunidades.tsx          # Lista de comunidades
    ├── comunidades.$communityId.tsx  # Detalhe comunidade
    ├── eventos.tsx              # Eventos
    ├── mensagens.tsx            # Mensagens
    ├── mentoria.tsx             # Mentoria
    ├── rede.tsx                 # Rede de conexões
    ├── salvos.tsx               # Posts salvos
    ├── vagas.tsx                # Vagas
    └── perfil.$username.tsx     # Perfil do usuário
```
