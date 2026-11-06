## O que muda

<!-- Resumo em 2 ou 3 linhas. -->

## Por quê / contexto

## Depende do backend?

<!-- Sim ou não. Se sim, qual endpoint. -->

## Como testar

1.
2.

## Prints ou vídeo

<!-- Desktop e mobile. -->

## Issue de origem

<!-- Obrigatório: Closes #NNN. A issue tem o plano de implementação e como a entrega será provada. -->

## Checklist

- [ ] Branch created from an up-to-date `qa` and the PR targets `qa` (hotfix: `main`)
- [ ] A PR trata de um único tema
- [ ] `npm run lint`, `npm run typecheck`, `npx vitest run` e `npm run build` passam
- [ ] Descrevi acima como verifiquei ("roda" não é verificação)
- [ ] Textos novos estão em `src/texts.ts`
- [ ] Não há segredo nem chave no diff
- [ ] Sem stub, placeholder, TODO fingindo conclusão ou fallback silencioso
- [ ] Sem asserção enfraquecida, teste pulado ou `eslint-disable`/`@ts-ignore`/`as any` novo
- [ ] Design system respeitado: view no DS, token de tema, contraste AA, acessibilidade
- [ ] Autorrevisão feita: li o `git diff` linha a linha e entendo cada linha
- [ ] AI tools helped write this change (check if yes; no tool name or attribution line needed)
- [ ] Conferi no browser em desktop e mobile
- [ ] Campos novos têm rótulo (acessibilidade básica)
- [ ] Funciona nos temas claro e escuro
