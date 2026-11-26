# Integração do painel sobre a QA atual

> Registro da preparação inicial, anterior à instalação do pacote e aos gates completos.
> Essa continuação foi executada e está na [prova reconciliada](qa/README.md), com 1443
> testes do consumidor e 54 checks de navegador. Permanecem os bloqueios de publicação,
> instalação limpa, CI/revisão humana e revalidação da estabilidade de foco ali descritos.
> As pendências e a ausência de pacote registradas abaixo são históricas dessa preparação.

## Composição e limite da preparação

- Base consultada por `git fetch upstream qa`: `ef1e0d2ff518c0efac3bdaedee3aba1dab0795a0`.
- Branch local: `feat/admin-workspace-review`, criada diretamente dessa QA.
- Origem do delta WIP: `enois-frontend-moderation`, HEAD
  `1820fe0bcba8de4630318a4c13a6c5d41cae90e8`.
- Porte por `git diff --binary HEAD` e `git apply --3way`, mais os arquivos novos do painel.
  Não houve merge ou cherry-pick da branch anterior de transparência e sessão.
- Escopo rastreado em frontend#891, design-system#245 e backend#729. A navegação de
  frontend#760 / PR#758 é contexto anterior, não outra issue a publicar.
- Nenhum commit, push, PR, publicação de pacote ou deploy nesta preparação.

## Sobreposições reconciliadas

O único arquivo com conflitos foi `src/routes/moderador.tsx`: imports e mapas de ícones da
navegação anterior, além do fechamento do workspace ao lado da área da rede. A composição
usa o `ModeratorWorkspace` do WIP e preserva `NetworkNodesSection`, sua condição de admin
e os dados da aba `network` vindos da QA. Os mapas locais antigos foram removidos porque
não são mais usados pelo novo workspace. Dois imports sem uso deixados pela extração da
fila também foram removidos.

Todos os contratos, componentes e clientes de rede/provisionamento que já estavam na QA
permanecem sem alteração. Não foi incorporada a PR#889 de token de provisionamento. Os
campos existentes dos DTOs de moderação, sessão e penalidades também não foram substituídos
pelas versões da branch antiga. Código de penalidades que já existe na QA permanece base,
não mudança desta entrega.

`eslint-suppressions.json` foi reconciliado por entradas: somente a dívida de markup de
`src/routes/moderador.tsx` diminui de 323 para 249. A entrada de `src/routes/penalidades.tsx`
com contagem 55 e todas as demais entradas atuais da QA foram preservadas. Nenhuma nova
violação foi suprimida.

A rota legada continua acima de 600 linhas, mas o porte a reduz por extração da fila e da
navegação já implementadas no DS. Não foi ampliada a refatoração às seções administrativas
fora do pedido.

## Dependências e verificações atuais

`package.json` e `package-lock.json` permanecem idênticos à QA, incluindo a dependência
`@rede-enois/design-system` em `^0.35.0`. As dependências locais foram copiadas fisicamente
para este worktree, sem junction, symlink ou instalação no worktree original. O DS antigo
`0.34.1` e os caches do Vite foram excluídos da cópia. O pacote do DS permanece ausente
até o fornecimento do tarball reconciliado; não há caminho local nos manifestos.

Foram executados somente checks independentes do pacote do DS:

- ESLint focal nos nove arquivos TypeScript/TSX alterados: código 0, zero erros e zero avisos.
  As supressões legadas existentes foram mantidas; nenhuma supressão nova foi criada.
- `panel-groups.test.ts`: 13 testes aprovados, zero falhas ou pendências, incluindo a preservação
  da área `network` restrita a admin. Esse teste é de dados de navegação, não renderização do app.
- `node scripts/check-lint-suppressions.mjs HEAD`: código 0, dívida não aumentou.
- `git diff --check HEAD`: código 0, sem conflitos ou problemas de whitespace no diff rastreado.
- Prettier somente nos arquivos alterados; o inventário e as capturas históricos não foram
  reescritos nem anunciados como novas evidências.

O executor de testes emitiu aviso de configuração esbuild/oxc já presente; não foi alterada
configuração para ocultá-lo. Não houve execução de lint completo, typecheck, testes de componentes,
suíte integral, build ou navegador nesta composição. As capturas e resultados do
[README histórico](README.md) não substituem essas verificações pendentes.

## Próximas condições de liberação

1. Receber o tarball do DS reconciliado sobre a QA atual, com os exports do painel e da rede.
2. Instalar somente no worktree isolado, sem salvar caminho de tarball no manifesto ou lockfile,
   e conferir conteúdo/exports efetivamente instalados.
3. Executar gates completos na composição final, inclusive os testes de container com a view real.
4. Produzir novas provas de navegador sobre este worktree; o agente coordenador é responsável
   por essa etapa, com o script original e API simulada explicitamente identificada.
5. Coordenar a entrega do contrato JSON das ações administrativas do backend.
6. Obter publicação de RC/versão pelos mantenedores, atualizar consumidor e validar instalação
   limpa pelo lockfile antes de declarar integração liberada.

**Estado: não-pronto para merge.** Esta etapa prepara o porte e documenta sua composição;
nenhum resultado histórico autoriza declarar o novo consumidor verde.
