## Bug

<!-- O que acontecia e como reproduzir. -->

## Causa

## Correção

## Como verificar

1.
2.

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
- [ ] Corrigi a causa, não só o sintoma
- [ ] Conferi outros lugares que usam o mesmo código
