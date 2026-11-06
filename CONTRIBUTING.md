# Como contribuir

Obrigado pelo interesse. Este é o frontend do **Énóis** (React 19 + TanStack Start, SSR). O backend
fica no repositório `enois-backend` — muita coisa só faz sentido com os dois no ar (veja o README).

Antes de começar: leia o [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Falha de segurança **não** vira
issue — o canal está no [`SECURITY.md`](SECURITY.md).

## Fluxo via fork

1. Faça o fork de `Rede-ENois/enois-frontend` e clone o seu fork.
2. Adicione o repositório original: `git remote add upstream git@github.com:Rede-ENois/enois-frontend.git`
3. Crie a branch a partir da `main` atualizada, com prefixo `feat/`, `fix/`, `chore/` ou `refactor/`:

```bash
git fetch upstream && git checkout -b feat/minha-mudanca upstream/main
```

A PR é sempre contra `qa`: o fluxo é `feature` → `qa` → `main` (o merge `qa` → `main` acontece
depois que a mudança é validada na qa). Uma PR com o histórico inteiro do fork (centenas de commits
e arquivos) não é revisável: ninguém consegue saber o que mudou de fato. Parta sempre da `qa`
atualizada (`upstream/qa`).

## Rodando

```bash
# Required: a GitHub token with read:packages (see "npm install requires a GitHub token" in the README)
export NODE_AUTH_TOKEN=ghp_your_token
npm install
npm run dev
```

Para apontar num backend local, siga a seção "Como rodar localmente" do README (o proxy do dev
precisa do `BACKEND_TARGET` e o backend precisa subir com `--server.servlet.context-path=/api`).

## Antes de abrir a PR

```bash
npm run lint         # eslint (inclui as regras locais)
npm run typecheck    # tsc --noEmit
npx vitest run       # testes de lógica pura
npm run build        # build de produção
```

### Cliente OpenAPI

O contrato usado pelo Orval fica em `specs/openapi.json` como um ponto de partida local. Os arquivos
gerados em `src/lib/api/generated/` e `src/types/generated/` não são versionados. Com o backend
rodando, `npm run generate:api` busca `GET /api/openapi.json`, valida que o documento tem pelo menos
um caminho e só então gera o cliente Zod. Se o backend estiver indisponível ou o contrato estiver
vazio, o comando falha para não produzir um cliente falso.

`npm run generate:api:watch` observa apenas o contrato já salvo e não faz chamadas ao backend; use-o
depois de uma execução bem-sucedida de `npm run generate:api`.

**Nada disso vê a tela.** Se a mudança aparece para quem usa, abra o navegador e olhe — e conte na PR
o que você viu. Build verde com tela quebrada é o jeito mais fácil de publicar um bug.

## Lint que bloqueia

O `npm run lint` roda no pre-commit e no CI de toda PR, e PR com erro de lint não entra. Além das
regras de sempre, ele recusa:

- **Markup no app** (`local/no-front-markup`): nada de elemento HTML (`<div>`, `<button>`...),
  `className` ou `style` em `src/**/*.tsx`. Toda view nasce no `@rede-enois/design-system`; aqui só
  se compõem componentes do DS, se passa dado e se liga callback. Precisa de layout novo? Vira view
  no DS (ou variante/prop de uma que já existe).
- **`eslint-disable`**: comentários de desligar regra são ignorados (`noInlineConfig`). Regra
  errada se corrige no `eslint.config.js`, numa PR revisada.
- **Cor fixa** em `.tsx` (`#7c3aed`): use os tokens do DS.
- **`localStorage`/`sessionStorage`** fora de `src/stores/`.
- **`console.log`/`console.debug`** (`console.warn` e `console.error` podem).
- **Import interno do DS** (`@rede-enois/design-system/dist/...`): só pelos entrypoints.

O código que já existia quando essas regras entraram está congelado no `eslint-suppressions.json`,
com a contagem por arquivo. Ele **só diminui**:

- Consertou violação antiga? Rode `npx eslint . --prune-suppressions` e commite o arquivo (o lint
  falha enquanto sobrar supressão sem uso).
- Violação nova não se suprime: o CI compara o arquivo com o da base e recusa a PR se alguma
  contagem subir (`scripts/check-lint-suppressions.mjs`). Renomear ou apagar arquivo antigo libera
  a contagem dele.

## Convenções da casa

**Comentário explica o porquê, não o quê.** O código já diz o que faz. O comentário existe para a
decisão que não é óbvia: por que esse limite, por que essa ordem, o que quebrava antes. Em português,
com o mesmo tom do resto do arquivo.

**Texto de tela nunca é literal no componente.** Tudo que a pessoa lê mora em `src/texts.ts`. Um
rótulo solto no JSX vira string duplicada e divergente na segunda tela que precisar dele.

**Um tipo por arquivo, em `src/types/**`.** A regra `local/type-boundaries` recusa `type`/`interface`
fora de lá; o caminho do arquivo espelha o módulo (`types/application/games/game-view.ts`).

**Espaçamento de JSX** (`local/jsx-content-spacing`): irmãos **com** conteúdo ficam separados por
linha em branco; elementos sem conteúdo (auto-fechados) ficam agrupados, sem linha em branco. É
auto-corrigível: `npx eslint <arquivo> --fix`.

**Formatação**: prettier cuida (100 colunas, aspas duplas, imports ordenados por grupo). Rode
`npx prettier --write <arquivo>` nos arquivos que você tocou — **não** no repositório inteiro: isso
reformata código alheio e polui o diff.

**Sem dependência nova sem justificativa.** Este projeto já resolveu coisas grandes com o que tem
(o parser de markdown é nosso, o seletor de emojis é uma lista, a medida do quadro é CSS + DOM). Se
você acha que precisa de uma biblioteca, diga na PR o que ela resolve que o resto não resolve.

**Rota que é página e mãe ao mesmo tempo.** No roteamento por arquivo, uma rota vira mãe da outra
pelo nome (`vagas.tsx` é mãe de `vagas.$jobId.tsx`). Mãe com componente **precisa** devolver
`<Outlet/>` quando a filha casa, senão a filha não renderiza e a URL muda sem a tela mudar — é o
"clico e não abre nada". Os dois idiomas aceitos estão em `vagas.tsx` (`useMatchRoute`, com
`fuzzy: true` quando a filha tem filha) e em `blog.$username_.$postId.tsx` (o `_` no nome do arquivo
quebra o aninhamento).

**Acessibilidade não é extra.** Botão só com ícone leva `title` **e** `aria-label`; quadro isolado
leva `title`; diálogo leva título. O resto do padrão está nos componentes de `src/components/ui`.

## Testes

Vitest para lógica pura (parser, formatação, cálculo, inserção no cursor): `npx vitest run <arquivo>`.
Componente com tela e sessão se verifica no navegador, com backend de verdade — é o que a PR deve
descrever.

## Commits e PRs

- Um assunto por PR. PR grande de coisa não relacionada é PR que ninguém revisa.
- Mensagem no imperativo e com escopo: `fix(blog): o post do blog abre, com conteúdo e ações`.
  O corpo explica o que estava errado antes — não o que o diff já mostra.
- Descreva na PR **como você verificou**. "Roda" não é verificação.
- Nunca suba segredo, token, `.env` preenchido ou print de conversa privada.
- Escolha o template pelo tipo de mudança (`?template=...` na URL ou `gh pr create --template ...`):

  | Tipo                                         | Template     |
  | -------------------------------------------- | ------------ |
  | Funcionalidade nova                          | `feature.md` |
  | Correção de bug                              | `fix.md`     |
  | Manutenção, docs, CI, dependências, refactor | `chore.md`   |

## Regras de pull request

Uma PR só é revisada se cumprir os seis pontos abaixo. PR que não cumpre volta sem revisão.

1. **Uma feature por PR.** Correção de bug, refactor e feature não viajam juntos. PR grande demais
   para revisar é PR que ninguém revisa de verdade.
2. **Teste para cada mudança de comportamento.** Feature nova tem teste; bug corrigido tem teste de
   regressão que falha no código antigo. Teste e implementação no mesmo commit.
3. **Documentação atualizada no mesmo PR.** Mudou o módulo? A doc dele muda junto. `docs/` descreve o
   que existe — não o que se pretende.
4. **Sem comentário narrando o óbvio.** Comentário registra restrição que o código não mostra. O
   resto é ruído que envelhece mal.
5. **Lint, typecheck, teste e build verdes antes do push.** Sem `eslint-disable`, `@ts-ignore` ou
   `as any` novo para chegar lá.
6. **Issue aberta com o plano de implementação.** A PR referencia a issue; a issue diz o que será
   feito e como será provado. Trabalho sem origem rastreável não entra.

Além disso: a PR declara o uso de IA no checklist do template, e o merge exige aprovação de alguém
que não empurrou o código.

## Design system

A interface é construída sobre `@rede-enois/design-system` (repositório `enois-design-system`). Ele é
contrato, não sugestão:

- componente que o design system já tem **não é reimplementado no front**;
- cor, espaçamento, raio e tipografia vêm de token do tema — hex solto, `px` arbitrário e
  `!important` para vencer o tema não passam;
- todo par texto/fundo passa WCAG AA nos dois modos e nos temas suportados;
- elemento interativo é botão ou link de verdade, com rótulo acessível e foco visível;
- falta um componente? A mudança começa no `enois-design-system`, com versão nova e consumidor
  atualizado — não num componente local que depois diverge.

## Árvore compartilhada

Se você trabalha na mesma cópia do repositório que outra pessoa (ou outro agente): não rode
`eslint --fix`, `prettier --write` nem `git checkout` no repositório inteiro, e não commite arquivos
que não são seus. Rode as ferramentas no arquivo que você tocou e olhe `git status` antes de
`git add`.

## Contribuições com IA

Este projeto aceita e usa código escrito com ajuda de IA — com as mesmas regras de sempre e mais
algumas próprias:

1. **Declare the use.** Check the AI box in the PR template checklist. No tool name and no
   attribution line (Co-Authored-By, "Generated with") in commits or PRs: the checkbox is the record.
2. **Quem submete responde pelo código.** Entenda cada linha antes de abrir a PR; saída de IA colada
   sem revisão é a forma mais rápida de introduzir regressão sutil.
3. **Prova, não promessa.** "Deveria funcionar" não é verificação: rode lint, typecheck, testes e
   build, e descreva o resultado na PR.
4. **Zero slop.** Sem comentário narrando o óbvio, sem arquivo gerado em massa, sem dependência nova
   sem justificativa, sem refatoração que a tarefa não pediu.
5. **Segurança vem primeiro.** As regras do [`AGENTS.md`](AGENTS.md) valem integralmente — em
   especial: mensagem de commit neutra, nenhum detalhe de correção de segurança no texto público,
   nenhum segredo ou dado pessoal em qualquer artefato.
6. **Revisão humana antes do merge continua sendo a regra**, com aprovação de quem não empurrou.

O contrato completo para agentes está no [`AGENTS.md`](AGENTS.md).
