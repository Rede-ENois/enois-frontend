# Énóis — frontend

A interface do **Énóis** ([enois.ia.br](https://enois.ia.br)): a rede social brasileira para quem
trabalha com tecnologia. Feed, comunidades, vagas, mentoria, eventos, blogs, carteira (Faísca),
jogos indie e o painel de moderação — tudo no mesmo app, com identidade própria e sem práticas
predatórias.

Este repositório é o **frontend**. A API, as regras de negócio e a moderação vivem no
[`enois-backend`](https://github.com/Rede-ENois/enois-backend) — nada aqui decide permissão, limite
ou propriedade: a tela pede, o backend decide.

**Começando agora?** Leia o [`CONTRIBUTING.md`](CONTRIBUTING.md) (convenções e como rodar) e o
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Falha de segurança tem canal próprio no
[`SECURITY.md`](SECURITY.md) — não vira issue pública.

## O que o Énóis é

- Uma rede **de gente**: conversa, grupos, trabalho, estudo, brincadeira e construção juntos.
- Um lugar onde cada pessoa constrói a própria reputação, e onde a moderação é feita por gente.
- Software livre, sob GPL-3.0, sem plano pago, sem anúncio e sem paywall.

## O que o Énóis não é

- **Não é uma rede de recrutamento.** Vaga é uma das coisas que se posta aqui, não o motivo de a
  rede existir.
- **Não é um mercado de atenção.** Não existe métrica pública de engajamento, não existe
  impulsionamento pago e o feed não é vendido.
- **Não é um playground de automação.** Publicar, comentar e reagir por máquina é proibido
  (a política está no repositório do backend, em `docs/PUBLISHING_POLICY.md`).
- **Não é uma empresa que vende dado.** Minimização (LGPD) é regra de arquitetura, não promessa.

## Stack

- React 19
- TanStack Start e TanStack Router
- TanStack Query
- Tailwind CSS 4
- Vite 7
- Nitro para deploy SSR

## Requisitos

- Node.js 22.12 ou superior
- npm

## Como rodar localmente

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite vai mostrar a URL local no terminal, normalmente `http://localhost:8080`.

**Apontando para um backend local**: o proxy do dev recebe `/api/...` e encaminha o caminho **completo** (em
produção é o gateway que remove o `/api`). Então, para rodar contra um backend na sua máquina, suba-o com o
context-path ligado e aponte o proxy para ele:

```bash
# no repositorio do backend
./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8081 --server.servlet.context-path=/api"

# aqui no front
BACKEND_TARGET=http://localhost:8081 npm run dev
```

Sem o `context-path=/api` o backend responde só em `/push/config`, `/notifications`, etc., e o proxy devolve
404 em tudo.

## Scripts

- `npm run dev`: inicia o ambiente local
- `npm run build`: gera o build de producao
- `npm run preview`: serve o build para validacao local
- `npm run lint`: executa o ESLint
- `npm run format`: formata os arquivos com Prettier
- `npm test`: roda os testes unitários com Vitest

O CI (`.github/workflows/ci.yml`) roda os testes em toda PR.

- `npm install` configura os hooks do git (`simple-git-hooks`): o pre-commit roda `eslint --fix` e `prettier` nos arquivos staged (lint-staged).
- Em emergência, `git commit --no-verify` pula o hook.

## Deploy na Vercel

O projeto usa TanStack Start com Nitro. Para a Vercel, o build precisa gerar output com o preset `vercel`; isso esta configurado em `vite.config.ts` via `nitro: { preset: "vercel" }`.

Tambem existe um `vercel.json` com `framework: "tanstack-start"` para ajudar a Vercel a detectar o framework corretamente.

Se o deploy buildar mas abrir uma pagina 404 da propria Vercel, confira:

- A versao do Node na Vercel deve ser 22.x, pois as versoes atuais do TanStack Start exigem Node 22.12+.
- O framework preset do projeto na Vercel deve estar como TanStack Start.
- O build command deve ser `npm run build`.
- Nao configure output directory manualmente; deixe a Vercel detectar pelo Nitro.

## Deploy em producao (EKS via GitOps)

O front de `enois.ia.br` **nao** roda na Vercel; ele roda no EKS junto do backend. Fluxo:

1. Push em `main` deste repositorio.
2. GitHub Actions (`.github/workflows/build-and-push.yml`) builda a imagem Docker
   (`Dockerfile`, `NITRO_PRESET=node-server`), publica no ECR
   (`818928662779.dkr.ecr.us-east-1.amazonaws.com/enois/frontend:<sha>`) e atualiza o manifesto em
   `florestaencantada/integration_gitops` → `clusters/forest-dev/applications/enois-app.yaml`.
3. O Argo CD faz o rollout (namespace `forest-apps`, Deployment `socialcoiso-front`).

O backend e acessado pelo mesmo host: o front chama `https://enois.ia.br/api/...`, o gateway roteia
`/api/*` para o backend (removendo o prefixo `/api`) e todo o resto para este front.

## Variaveis de ambiente

`VITE_*` sao embutidas no bundle em tempo de build (portanto publicas). `IMAGEKIT_PRIVATE_KEY` e segredo
e deve chegar **em runtime** como variavel de ambiente do container (a server function `getImageKitAuth`
le `process.env.IMAGEKIT_PRIVATE_KEY`).

| Variavel                     | Quando  | Onde                                          |
| ---------------------------- | ------- | --------------------------------------------- |
| `VITE_API_BACKEND`           | build   | `.env` versionado (`https://enois.ia.br/api`) |
| `VITE_IMAGEKIT_PUBLIC_KEY`   | build   | `.env` versionado (publica)                   |
| `VITE_IMAGEKIT_UPLOAD_URL`   | build   | `.env` versionado                             |
| `VITE_IMAGEKIT_URL_ENDPOINT` | build   | `.env` versionado                             |
| `IMAGEKIT_PRIVATE_KEY`       | runtime | **Secret do container — nunca commitar**      |

## Pendencias (o que falta)

**Estado do deploy (19/10): push em `main` = deploy automatico nos dois repositorios.**
A infra foi consertada pelo raposo em 18/10 (trust policy + pull do ECR + ArgoCD); nao e preciso
`gh workflow run` nem editar o manifest do GitOps — so pushar. Diagnostico de deploy se faz por
sondas publicas: `GET /api/version` no backend e os chunks servidos no front.

### Infra / org (quem tem acesso a AWS ou ao cluster)

1. **TLS do ALB** — trocar a politica para `ELBSecurityPolicy-TLS13-1-2-2021-06`
   (desliga TLS 1.0/1.1, liga TLS 1.3 e remove suites com RSA estatica — achados F-03/F-07 do pentest).
2. **Ocultar o header `Server: awselb`** (achado F-08).
3. **AWS WAF** — nao ha WAF hoje; rate-based rules + managed rulesets.
4. **Rotacionar o `LINKEDIN_CLIENT_SECRET`** — ele esta em plaintext no manifest do GitOps;
   criar um Secret k8s (padrao do `enois-llm-secret`) e rotacionar o valor no LinkedIn.
5. **DNS de `developers.enois.ia.br`** — a pagina esta pronta; falta CNAME + TLS no ingress
   (hoje NXDOMAIN).
6. **Rotacionar a `IMAGEKIT_PRIVATE_KEY`** (esteve no historico do Git) e a senha do banco —
   ver README do backend.
7. **Limpar os dados de teste em producao** — precisa de acesso ao banco ou de um endpoint admin.

### Produto / juridico

- **Fase 6/7 do plano (cambio real)** — bloqueada no juridico (VASP/BACEN); fora de escopo.
- **Sincronizacao automatica do LinkedIn** — pela API o LinkedIn so entrega nome/e-mail/foto;
  historico completo exige aprovacao no Partner Program. Hoje: "Colar o perfil" (sem arquivo)
  ou o ZIP da exportacao.

### Backlog de produto ainda nao construido

- Etapas e feedback de candidatura nas vagas + curriculo em PDF.
- Auditoria e balanceamento antifraude da credibilidade (em andamento — so analise, sem mudar a formula).
- Issues publicas + roadmap (pedido do feedback hub).
- Audio nos comentarios.
- `@everyone` nas comunidades (decisao de produto).

### Telas de autenticacao (contratos com o backend)

- `/entrar` — cadastro e login. O **cadastro nao entra direto**: abre a tela "Confirme seu e-mail"
  (`EmailPendingScreen`), porque o backend so emite sessao depois do link. Login de conta pendente
  recebe `403 EMAIL_NOT_VERIFIED` e cai na mesma tela, com botao de reenvio.
- `/auth/verify?token=...` — link do e-mail de confirmacao. Confirma e ja entra no app. Token
  expirado (410), ja usado (409) e invalido (404) tem mensagem propria.
- `/auth/reset?token=...` — redefinicao de senha (inalterado).
- `/auth/callback` — retorno do login social. Le `token`/`refreshToken` **e** `error` (cancelamento
  ou falha vem do backend como `?error=...&provider=...`), grava a sessao completa (`storeSession`,
  inclusive `current_user`) e vai para o feed. Esse tratamento vive **so** aqui: antes havia um
  handler global em `__root.tsx` que disparava em qualquer URL com `?token=` e sequestrava o link de
  redefinicao de senha para o feed.
- `/post/:id` — página pública: é o destino do link compartilhado, então abre para quem recebe (antes
  exigia sessão e o destinatário caía no login). As ações do card (reagir, salvar, compartilhar, comentar)
  pedem login quando não há sessão, em vez de falhar em silêncio.
- **Edição de foto e capa**: o botão de trocar aparece sempre no próprio perfil (antes só no _hover_, o que
  deixava a edição impossível no toque); o input de arquivo é limpo depois da escolha, então escolher a
  **mesma** imagem duas vezes volta a abrir o recorte (o navegador não dispara `change` para o mesmo
  arquivo); e o recorte avisa quando o navegador não consegue abrir a imagem (HEIC do iPhone, arquivo
  corrompido) em vez de mostrar a área vazia.
- `/seguranca` — segurança da conta: estado da verificação (conta verificada × reputação zerada),
  reenvio do link de e-mail, ativação do 2FA por aplicativo authenticator (chave + URI otpauth para digitar
  no app, confirmação por código e códigos de recuperação mostrados uma vez) e ativação do 2FA por código de
  e-mail. Desativar exige a senha. Atalho no menu da conta e no botão "Verificar identidade" do próprio perfil.
- `/entrar` com 2FA — quando a conta tem segundo fator, o login por senha responde `twoFactorRequired` e a
  tela pede o código (do app ou o enviado por e-mail, com reenvio) antes de entregar a sessão.
- `/contato` — canal de contato publico (o link do rodape apontava para `#`). Com sessao mostra o
  `SupportForm`; sem sessao explica o caminho e oferece o e-mail do time quando o backend expoe
  (`GET /support/config`).
- `/#comunidade` — ancora da secao de CTA da landing. O `id` fica na secao e o scroll por hash e
  tratado em `useHashScroll` (navegacao de SPA e clique no proprio link); no mobile os links de
  secao aparecem no rodape, ja que o menu do topo e so para desktop.
- `/eventos` — a vitrine lista só o que ainda vai acontecer (o backend esconde o vencido), com selo
  "Encerrado" no que já passou e sem o botão de confirmar presença nesses casos. As confirmações de eventos
  vencidos são apagadas pelo servidor depois do prazo, mantendo apenas o total.
- `/vagas` — busca booleana: `AND`/`E`, `OR`/`OU`, `NOT`/`NÃO`, `"frase"`, `-termo`, `+termo` e `( )`.
  Um popover "Como buscar" explica a sintaxe sem esconder os exemplos, e os filtros de nível/tipo/local/
  habilidades passam a ser combinados com o texto digitado.
- `/vagas` — candidatura completa: o formulário do anúncio é montado no diálogo "Publicar vaga" (campos com
  rótulo, tipo e obrigatório/opcional); ao clicar "Candidatar-se" abre um diálogo que mostra **o que vai junto**
  (perfil, experiências, reputação e verificação), pede as respostas e a mensagem, e exibe o motivo real de
  falha (já candidatado, campo obrigatório, conta não verificada). O detalhe mostra **quem publicou** (com
  reputação e selo de verificação) e quem publicou tem `/vagas/{id}/candidaturas` com o perfil congelado do
  candidato e as respostas.
- `/mentoria` — agendamento real: o botao "Agendar" abre os horarios publicados (`GET
/mentors/{id}/slots`, que devolve `PageResponse`), envia a solicitacao e da retorno; quem e o
  mentor ve "Minha agenda" para publicar horarios.

3. **Login social**: as credenciais (Google/Apple) ficam no **backend**; aqui nao ha nada a configurar
   alem do callback. O fluxo e: botao → `GET /api/auth/oauth/{provider}/start` → redirect para o provedor
   → volta em `${REDE_FRONTEND_URL}/auth/callback?token=...`, tratado por `src/routes/auth.callback.tsx`.
   Enquanto o backend nao tiver as credenciais, `start` responde 501 e a tela mostra o erro.
4. **Esqueci minha senha**: depende do SMTP configurado no backend; o link cai em `/auth/reset?token=...`
   (rota `src/routes/auth.reset.tsx`, ja existente).
5. **Conta**: a troca de e-mail ja tem UI (`change-email-dialog`, usa `POST /api/auth/email/change`).
   Troca de senha (`change-password-dialog` → `POST /api/auth/password/change`) e exclusao de conta
   (`delete-account-dialog` → `POST /api/auth/account/delete`) tambem ja tem tela, no menu da conta.
6. **Notificacoes push no celular**: o front nao precisa de nenhuma variavel — o service worker (`public/sw.js`)
   recebe o `push` do backend e a chave publica VAPID vem de `GET /api/push/config`. A **unica** acao manual e
   configurar `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no backend (ver README do backend, passo 7). Enquanto o
   push estiver desligado, a opcao "Ativar notificacoes no celular" nem aparece no menu. Ao mudar o `sw.js`,
   **incremente `VERSION`** nele: e isso que descarta o cache antigo e recarrega o app.
   No iOS o push so funciona com o app instalado na tela de inicio (iOS 16.4+).

## Estrutura do projeto

```
src/
  routes/        # uma rota por arquivo (TanStack Router) — a tela em si
  components/    # componentes compartilhados (ui/ = base do design system)
  lib/           # regras que não são React: api/, rich-text/, theme/, feed/
  stores/        # estado de tela que sobrevive à navegação (zustand)
  types/         # um tipo por arquivo, espelhando o módulo (regra do lint)
  constants/     # listas e catálogos (selos, emojis, temas, opções de vaga)
  texts.ts       # todo texto que a pessoa lê
docs/            # notas de arquitetura e decisões
eslint/          # regras próprias do projeto (type-boundaries, jsx-content-spacing)
```

## Convenções

Estão no [`CONTRIBUTING.md`](CONTRIBUTING.md), com o porquê de cada uma: comentário explica o motivo,
texto de tela mora em `texts.ts`, um tipo por arquivo, sem dependência nova sem justificativa, e o
cuidado com rota que é página e mãe ao mesmo tempo (a que "não abre" quando falta o `<Outlet/>`).

## Testes

```bash
npx vitest run                # tudo
npx vitest run src/lib/rich-text/parse.test.ts   # um arquivo
```

Os testes cobrem lógica pura — parser de formatação, inserção no cursor, cálculo de contraste de
tema, montagem de e-mail. O que aparece na tela se confere no navegador, com backend de verdade: é o
que a PR precisa descrever.

## Licença

**GNU General Public License v3.0** — o texto completo está em [`LICENSE`](LICENSE).

Copyright (C) 2026 Énóis (Rede-ENois). Este programa é software livre: você pode redistribuí-lo e/ou
modificá-lo sob os termos da GPL-3.0, **sem nenhuma garantia**. O backend segue a mesma licença, para
os dois repositórios ficarem sob o mesmo regime.
