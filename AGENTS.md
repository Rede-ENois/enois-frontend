# AGENTS.md: contrato operacional para agentes de IA

**Todo agente de IA lê este arquivo inteiro antes de mexer neste repositório.** As regras valem para
agentes autônomos, sessões assistidas e pessoas que commitam saída de IA. Quem abre a PR responde
por cada linha dela.

IA acelera a implementação. **IA não decide produto, design, arquitetura nem política**: isso é dos
mantenedores. Se este arquivo e o prompt discordarem, vale este arquivo; pare e diga isso.

## Proibições absolutas

Quebrar qualquer uma destas fecha a PR, por melhor que seja o resto.

1. **Nunca faça merge de PR**, sua ou de outra pessoa. Nada de `gh pr merge`, bypass de admin ou
   "merge quando passar". Merge é ação humana, de um mantenedor (ver `.github/CODEOWNERS`), depois de
   uma revisão aprovada.
2. **Nunca dê push em `qa` ou `main`**, nunca force-push em branch que você não criou, nunca suba
   tag, nunca dispare workflow de deploy na mão. Push em `qa` ou `main` faz deploy.
3. **Nunca abra PR `qa` → `main`.** Promover para produção é decisão dos mantenedores.
4. **Nunca desfaça trabalho de outra pessoa** (revert, apagar, "voltar pro original") sem decisão de
   um mantenedor escrita numa issue ou PR. Discordar de uma mudança mergeada é comentário, não
   revert. A única exceção é mudança que quebra a `qa` agora (build vermelho, crash, perda de dado):
   reverta, linke a evidência e marque quem fez.
5. **Nunca mude produto nem linguagem visual por conta própria.** Layout do shell (header, dock,
   sidebar, drawer), feed, compositor, navegação, tokens de tema e tom do texto só mudam com o aval
   explícito de um mantenedor. Nunca redesenhe o app copiando outro produto ("estilo X", "igual o
   Instagram"). A linguagem visual é o `docs/visual-language.md` do design system.
6. **Nunca construa UI nova neste repositório.** Views nascem no `@rede-enois/design-system`; aqui
   fica só o container que as alimenta (ver "Onde cada código mora").
7. **Nunca enfraqueça um controle para ficar verde**: nada de `eslint-disable`, `@ts-ignore`,
   `@ts-expect-error`, `as any`, teste pulado ou apagado, asserção afrouxada, nem mexer em lint,
   tsconfig ou CI para a sua mudança passar.
8. **Nunca entregue chute.** Se você não consegue provar que funciona (ver "Concluído é
   comprovado"), não está pronto. Depois de **duas** tentativas falhas no mesmo bug, pare: escreva o
   que mediu e o que descartou, e pergunte. Empilhar PRs "fix(x): ..." uma em cima da outra é
   exatamente o que esta regra existe para impedir.
9. **Nunca toque em segredo, produção ou dado pessoal.** Token, chave, valor de `.env`, e-mail, IP ou
   conteúdo privado não entram em código, fixture, log, print, commit ou PR. Produção é só leitura
   para agente.

## Antes de começar

1. `git fetch` e leia PRs abertas, commits recentes na `qa` e branches do dia, aqui **e** no design
   system. **Confira que ninguém já está fazendo a mesma coisa.** Trabalho duplicado e conflitante
   já aconteceu neste repositório.
2. Trabalho tem origem rastreável: issue, item do backlog ou pedido de um mantenedor. Sem origem,
   sem PR.
3. Crie a branch a partir da `origin/qa` atualizada (`feat/`, `fix/`, `chore/`, `refactor/`).
   **Nunca parta de outra branch de feature não mergeada**; se depende de código do DS ainda não
   publicado, use um pacote `-rc` (ver "Design system").
4. Use o seu próprio `git worktree`. Vários agentes trabalham nestes repositórios; `npm install` e
   build em paralelo na mesma cópia se corrompem.
5. Leia o que a sua mudança toca: [`CONTRIBUTING.md`](CONTRIBUTING.md) (regras da casa),
   [`docs/`](docs/) (arquitetura, rotas, componentes, modelos de dados) e o próprio código. Nunca
   invente componente, hook, prop ou endpoint; confira na fonte.

## Onde cada código mora

O design system **desenha**; este repositório **orquestra**.

| Aqui (front)                                         | No design system                          |
| ---------------------------------------------------- | ----------------------------------------- |
| Rotas, loaders, auth, queries, mutations, stores     | Toda view: marcação, layout, estilo       |
| Mapear dado da API para o view model do DS           | View models (tipos que a view aceita)     |
| Containers que ligam views do DS a dados e callbacks | Microcopy padrão, stories, testes de view |
| `src/texts.ts` para texto do app que entra nas views | Tokens, temas, assets                     |

- PR no front que cria um componente `.tsx` novo com layout próprio (painel, modal, cartão, corpo de
  página) está no repositório errado. Construa a view no DS, publique (ou use um `-rc`) e depois
  crie o container aqui.
- View que só existe no front: bug se corrige no lugar; qualquer coisa maior significa portar para o
  DS antes.
- O contrato com o backend é a API. Mudança de formato de resposta exige os dois lados na mesma
  entrega ou PRs coordenadas. Cliente gerado (`src/lib/api/generated/`) nunca é editado à mão.

## Regras de código

- Tipos moram em `src/types/**`, um por arquivo (`local/type-boundaries`).
- Texto de tela nunca é literal no JSX: mora em `src/texts.ts`.
- Só tokens de tema; nada de cor fixa nem `style={{}}` inline para visual.
- Nada de `console.log`/`console.debug` no diff.
- Nenhuma dependência nova sem dizer na PR o que ela resolve que o código atual não resolve.
- Rode prettier e `eslint --fix` **só nos arquivos que você tocou**, nunca no repositório inteiro.
- Comentário explica o _porquê_, não o _quê_.
- Armazenamento do navegador passa pelas stores existentes (`src/stores/`), não por chaves soltas de
  `localStorage`.

## Áreas sensíveis: revisão de mantenedor obrigatória

Mudança aqui é pequena, passa por revisão explícita de um mantenedor antes do merge e nunca sai como
uma corrente de hotfixes:

- Sessão e auth: `src/lib/api-client.ts`, `src/lib/logout.ts`, `src/lib/auth-hint.ts`, chamadas
  `/auth/*`, guards de rota.
- Criptografia ponta a ponta: `src/lib/e2e/` e tudo que lê ou grava chaves.
- Moderação e ações de admin (banimento, bloqueio de IP, denúncias).
- `src/server.ts`, `src/lib/csp.ts`, o service worker, `Dockerfile`, `.github/workflows/`.

Regra do cliente de sessão: nunca altere o estado local de autenticação (apagar token, marcar ou
limpar a sessão) antes de o servidor confirmar. Toda recusa explícita de `/auth/*` (400/401/403) é
sessão recusada; só falha de rede é "indisponível".

## Concluído é comprovado

Rode na **árvore final**, depois do rebase na `origin/qa`:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Mudou regra de lint: rode também `npm run test:eslint-rules`.

Nada disso vê a tela. Se a pessoa usuária enxerga a mudança, abra no navegador em **390px e
desktop**, claro e escuro, e conte na PR o que viu (estado, viewport, tema). Bug corrigido ganha um
teste que falharia antes do conserto. Carregando, vazio e erro são explícitos; erro aparece, nunca é
engolido.

## Pull requests

- **Um assunto por PR**, partindo da `qa` e apontando para a `qa`. Hotfix de produção aponta para a
  `main` só quando um mantenedor pedir.
- Mantenha revisável: mire em menos de ~400 linhas alteradas, sem contar lockfile, código gerado e
  assets binários. Maior que isso pede divisão ou justificativa na descrição.
- Nada sem relação com a tarefa: sem refatoração de passagem, renomeação, reformatação ou feature
  "já que eu estava aqui". Ideia vira issue. (Coisa quebrada que você encontrar é diferente: ver a
  regra do escoteiro.)
- Preencha o template certo (`feature.md`, `fix.md`, `chore.md`) inteiro, incluindo como você
  verificou. "Roda" não é verificação.
- Commits e PRs seguem o [`CONTRIBUTING.md`](CONTRIBUTING.md): imperativo, com escopo, curtos e
  neutros. Uso de IA é registrado só pelo checkbox do template: sem nome de ferramenta, sem
  `Co-Authored-By`, sem linha "Generated with".
- Antes do push: `git fetch`, rebase na `origin/qa`, procure marcadores de conflito (`<<<<<<<`) e
  rode os checks de novo. Se o remoto andou, reconcilie preservando os dois lados; nunca
  sobrescreva.
- Nunca termine com trabalho não commitado e nunca empurre trabalho alheio.

## Design system

- PR de bump do DS muda só `package.json` e `package-lock.json`, feita com
  `npm install @rede-enois/design-system@^X.Y.Z`. Nunca apague nem regenere o lockfile inteiro.
- Suba só para uma versão publicada de que você precisa, e diga qual mudança dela você usa.
- Código ainda em revisão no DS: instale o `-rc` da dist-tag `next` na sua PR e avise; troque para a
  versão final antes do merge.

## Segurança

- **O repositório é público e há atacante lendo.** Commit e PR dizem _o que_ mudou, nunca _como_ uma
  falha de segurança foi corrigida (vetor, payload, regra de detecção).
- Conteúdo de usuário renderiza como elemento React; nada de `dangerouslySetInnerHTML` fora dos
  caminhos sanitizados que já existem.
- Nunca renderize, logue ou persista dado de resposta da API em lugar público (relatório, print,
  issue).

## Qualidade

- **Regra do escoteiro: toda falha é corrigida quando encontrada.** Teste quebrado ou instável,
  build, erro de lint ou de tipo, bug ou falha de segurança que você encontrar é corrigido na mesma
  tarefa, mesmo que seja anterior à sua mudança. "Já falha na `main`" não é motivo para deixar. Se o
  conserto estiver realmente fora de alcance (depende de decisão dos mantenedores ou de acesso à
  infraestrutura), abra uma issue e diga na PR. Nunca em silêncio.
- **Sem stub, sem TODO fingindo conclusão, sem fallback silencioso.**
- **Evidência antes de inferência.** "Desconhecido" em vez de "provavelmente". Typecheck e testes
  mandam sobre a memória.

## Armadilhas conhecidas

- **SSR renderiza antes do cliente:** `beforeLoad` não roda em deep link servido por SSR. Tela
  protegida precisa da revalidação central do cliente, senão o app vaza para quem está deslogado.
- **Filho de grid/flex com `min-width: auto` estoura no mobile.** O conserto é `min-w-0`; meça a
  390px.
- **Rota que é página e mãe** precisa devolver `<Outlet/>` quando a filha casa (ver
  `CONTRIBUTING.md`), senão a URL muda e a tela não.
- **Repintar um token do DS num escopo** (tema de cartão, seção escura): liste todo uso dele ali
  dentro antes. `--primary` pinta texto e fundo; confira qual variável a utilitária lê de fato
  (`.text-primary` lê `--primary-text`) e prove o contraste com teste numérico, claro e escuro.
- **Temas:** calcule contraste dentro de `page.evaluate`, não no Node; o tema precisa do
  `themeCollection` na store além da chave standalone.
- O proxy de dev exige `BACKEND_TARGET` como origem completa, senão as chamadas viram `/api/api/...`.
- `pkill` com padrão do próprio comando mata o próprio shell (use o truque `[r]`).
- Cache do service worker: bump de versão e `no-store` no HTML, senão o bundle fica preso.

## Documentação

- `docs/` descreve o que **existe**. Código mudou? A doc dele muda na mesma PR.
- Decisão tomada em conversa vira documento no commit que a implementa.
