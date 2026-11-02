<!--
Há templates específicos por tipo de mudança. Para usá-los, acrescente à URL de criação da PR:
?template=feature.md, ?template=fix.md ou ?template=chore.md
Pelo terminal: gh pr create --template feature.md
-->

## O que muda

<!-- Uma frase dizendo o que a pessoa que usa passa a ver/fazer. -->

## Por quê

<!-- O problema que isso resolve. Se corrige um bug, diga como ele aparecia. -->

## Como foi verificado

<!-- Não vale "roda". Diga o que você fez para ver funcionando:
     - testes: qual arquivo, quantos passaram
     - `npm run lint` e `npm run typecheck`
     - build de produção
     - e, se a mudança aparece na tela, o que você viu no navegador -->

## Checklist

- [ ] `npm run lint` sem erros novos
- [ ] `npm run typecheck` sem erros novos
- [ ] `npx vitest run` passando
- [ ] Build de produção (`npm run build`) passa
- [ ] A mudança aparece na tela (ou é só código sem superfície visível)
- [ ] Sem dado pessoal, token ou print de conversa privada no diff
- [ ] AI tools helped write this change (check if yes; no tool name or attribution line needed)
