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
   uma revisão aprovada. Única exceção: o app `kof-agent-worker`, autorizado pelos mantenedores, pode
   fazer merge, e só com o CI verde e **nenhuma revisão `CHANGES_REQUESTED` em aberto**, de quem quer
   que seja. Pedido de mudança se resolve com nova revisão de quem pediu ou com dispensa explícita de
   um mantenedor, nunca passando por cima dele.
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

## Ciclo de trabalho

Ler o estado → escolher a tarefa de maior valor que ninguém reivindicou → implementar **um escopo
completo** → testar → commit → PR para `qa`.

- **Nunca perguntar quando as evidências do repositório podem responder.** Leia o código, o teste, o
  log. Pergunta é para decisão de produto, não para fato que está no arquivo.
- **Nunca encerrar um turno com trabalho não commitado, nem apenas com um resumo.**
- Exatamente um item do todo pode estar `in_progress`.
- **Concluído significa comprovado, não pretendido.**
- Pare e reporte quando a decisão exigir produto/linguagem visual (só mantenedor decide), houver
  colisão inevitável com a lane de outro agente, ou depender de acesso que você não tem.

## Gate de qualidade (Q0–Q7)

Fluxo de correção: **reproduzir → corrigir a causa-raiz → adicionar teste de prova → rodar os testes
relevantes → rodar a suíte → caçar casos-limite → commit → push.**

- **Q0 — causa-raiz.** Bug é corrigido na causa, não no sintoma. O teste de prova **falha no código
  antigo** e passa no novo. Teste que passa antes e depois não prova nada.
- **Q1 — cobertura.** Toda funcionalidade tem teste; toda correção tem teste de regressão; teste e
  implementação compartilham o commit; refactor preserva a prova existente.
- **Q2 — verde antes do push.** Lint, typecheck, teste e build verdes **antes** de empurrar.
- **Q3 — casos-limite.** Cobrir quando aplicável: vazio/null, limite de tamanho de campo, erro
  esperado, estado de carregamento, erro de rede versus erro de servidor, duplo clique, idempotência,
  viewport de 390px. **Só o caminho feliz é insuficiente.**
- **Q4 — caça.** Procurar ativamente: entrada extrema, fronteira do contrato da API, regressão em
  tela vizinha, comportamento não coberto.
- **Q5 — honestidade do verde.** Sem falso verde, sem asserção enfraquecida, sem `.skip` escondido.
  Vermelho seu é corrigido ou revertido.
- **Q6 — a suíte é o mínimo, não o teto.**
- **Q7 — proibido.** Stub, placeholder, `TODO`/`FIXME` fingindo conclusão, componente que devolve
  `null` para esconder ausência, branch não tratada engolida, suporte fingido como "não
  implementado". Estado não suportado aparece como erro explícito na tela, nunca como "talvez".

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

- **Nunca afirmar que está verde sem prova executada.** "Deveria passar" não é resultado.
- **Falha ambiental não é regressão sua** — mas precisa ser dita na PR, com o motivo e a evidência de
  que o mesmo erro existe na `qa` limpa. Exemplo conhecido: o design system instalado localmente
  desatualizado gera dezenas de erros de `tsc`; prove com um worktree da `qa` limpa antes de culpar o
  seu diff.

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

O DS é **contrato**, não sugestão. A view nasce lá; aqui só mora o container.

- PR de bump do DS muda só `package.json` e `package-lock.json`, feita com
  `npm install @rede-enois/design-system@^X.Y.Z`. Nunca apague nem regenere o lockfile inteiro.
- Suba só para uma versão publicada de que você precisa, e diga qual mudança dela você usa.
- Código ainda em revisão no DS: instale o `-rc` da dist-tag `next` na sua PR e avise; troque para a
  versão final antes do merge.
- **Componente que o DS já tem não é reimplementado aqui.** Antes de criar, procure no pacote. Se
  falta, a mudança começa no `enois-design-system` — não num componente local que depois diverge.
- **Token, não valor mágico.** Cor, espaçamento, raio, tipografia e sombra vêm de token do tema. Hex
  solto, `px` arbitrário e `!important` para vencer o tema são proibidos.
- **Tema é dado, não código.** Componente não assume um modo (claro/escuro) nem uma paleta fixa.
- **Contraste é requisito.** Todo par texto/fundo passa WCAG AA nos dois modos e nos temas
  suportados. Componente novo entra com verificação de contraste.
- **Acessibilidade mínima:** elemento interativo é botão ou link de verdade, tem rótulo acessível
  (`aria-label` quando não há texto visível), foco visível e navegação por teclado.
- **Camadas do DS:** `domain → patterns → ui`. Um componente de `ui` não importa de `patterns`;
  nenhum deles busca dados, navega ou lê store. Se precisa de dados, quem passa é o chamador.
- **Mudança no DS é mudança de contrato:** sobe versão, atualiza o consumidor no mesmo fluxo e prova
  que as telas que usam o componente continuam corretas.
- **Nada de estilo inline para resolver layout.** Se o layout quebra, o problema é a estrutura
  (grid/flex, `min-w-0`, largura mínima), não um `style=` de emergência.

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
- Documento que descreve comportamento que o código não tem é bug de documentação — corrija ou
  remova.

## Contribuindo com IA

O contrato completo está em [`CONTRIBUTING.md`](CONTRIBUTING.md#contribuições-com-ia). Resumo:

1. **Declare o uso** pelo checkbox do template. Sem nome de ferramenta, sem `Co-Authored-By`, sem
   "Generated with".
2. **Quem submete responde pelo código.** Entenda cada linha antes de abrir a PR.
3. **Prova, não promessa.** "Deveria funcionar" não é verificação.
4. **Zero slop.** Sem comentário narrando o óbvio, sem arquivo gerado em massa, sem dependência nova
   sem justificativa, sem refatoração que a tarefa não pediu, sem abstração especulativa.
5. **Revisão humana antes do merge continua sendo a regra**, com aprovação de quem não empurrou.

## Autoverificação final

Antes de dizer que terminou, confira cada item. **Se qualquer um for falso, o estado é `não-pronto`.**

- [ ] lint, typecheck, teste e build verdes na árvore final
- [ ] causa-raiz corrigida, não o sintoma
- [ ] teste de prova falha no código antigo
- [ ] casos-limite relevantes cobertos (vazio, carregando, erro, 390px)
- [ ] sem falso verde, sem asserção enfraquecida, sem skip escondido
- [ ] sem stub, sem placeholder, sem TODO fingindo conclusão
- [ ] sem `eslint-disable`, `@ts-ignore`, `as any` novo
- [ ] sem segredo, sem dado pessoal, sem detalhe de correção de segurança no texto público
- [ ] design system respeitado (view no DS, token, contraste AA, acessibilidade)
- [ ] documentação do módulo atualizada no mesmo commit
- [ ] árvore limpa, sem marcador de conflito, sem trabalho alheio
- [ ] remoto sincronizado

`if_any_false: state: não-pronto — next: corrigir-antes-da-entrega`
