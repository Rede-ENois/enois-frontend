# Instruções de revisão para o GitHub Copilot

Revise em português. O contrato completo do repositório está em `AGENTS.md` e `CONTRIBUTING.md`;
os pontos abaixo são os que mais escapam na revisão.

## Stack

React 19, TanStack Start (SSR) e TanStack Router, Vite, Tailwind 4 e o design system
`@rede-enois/design-system`. A API e as regras de negócio ficam no backend (`enois-backend`); o
frontend fala com ela por `src/lib/api-client.ts` e pelo cliente gerado pelo Orval.

## O que conferir

- **Prova.** Comportamento novo ou corrigido precisa de teste com asserção sobre estado e efeito
  (caminho feliz, erro e regressão que falharia sem a correção). Teste que só renderiza, ou só
  confere que não lançou exceção, não é cobertura.
- **SSR.** `beforeLoad` não roda em deep link servido pelo SSR: tela protegida precisa da
  revalidação central do cliente. Código que lê `window`, `document` ou `localStorage` no render
  quebra a hidratação.
- **Sessão.** Cookies HttpOnly (`enois_session`/`enois_refresh`), toda escrita manda
  `X-CSRF-Protection: 1`. O estado local de autenticação só muda depois que o servidor confirma;
  400/401/403 de `/auth/*` é sessão recusada, só falha de rede é "indisponível".
- **Contrato com a API.** Mudança de formato de resposta exige os dois lados na mesma entrega. Campo
  que a API pode devolver nulo precisa ser tratado como opcional.
- **Estados de tela.** Carregamento, vazio e erro explícitos; nada de erro engolido em silêncio.
- **Convenções.** Texto de tela mora em `src/texts.ts`; um tipo por arquivo em `src/types/**`;
  rota mãe com componente devolve `<Outlet/>`; botão só com ícone tem `title` e `aria-label`.
- **Temas.** São 60 temas em dois modos. Repintar um token num escopo exige trocar o par
  (`--primary` e `--primary-foreground`) e provar o contraste com teste numérico.
- **Layout mobile.** Grid/flex com filho de `min-width: auto` estoura a 390px; o conserto é `min-w-0`.
- **Segurança.** Nada de segredo, token ou dado pessoal em código, log, fixture ou print. Mensagem
  de commit e descrição de PR dizem o que mudou, nunca como uma falha de segurança foi corrigida.
- **Workflows.** Actions fixadas por SHA; `pull_request_target` nunca baixa nem executa código da
  PR; permissões mínimas por job.
- **Escopo.** Não peça refatoração sem relação com a PR, mas aponte quando a issue é dada como
  concluída e a implementação só cobre o caminho feliz.

Em cada achado, diga o arquivo, o cenário que reproduz o problema e o teste que falta.
