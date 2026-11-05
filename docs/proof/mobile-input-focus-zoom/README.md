# Campos de texto no mobile

A implementação da PR #651 foi transferida para os componentes do design system,
na [PR do DS #126](https://github.com/Rede-ENois/enois-design-system/pull/126).
O frontend remove a regra global de `font-size` e usa `Input` nas alternativas
de enquete e `Textarea` no compositor do canal. O limite de 1200 caracteres do
canal continua ativo, agora com o contador padrão do DS.

## Evidência reproduzível

Instale o pacote local gerado por `npm pack` no DS antes de executar esta prova.
Com Playwright disponível, execute:

```sh
node docs/proof/mobile-input-focus-zoom/verify.mjs
```

As variáveis `PLAYWRIGHT_MODULE` e `BROWSER_EXECUTABLE` permitem usar uma instalação
existente do Playwright e um navegador Chromium instalado. O script inicia seu
próprio Vite, carrega o `PollComposer` real e o `Textarea` configurado como no
canal. Ele confere a edição, remoção e inclusão de alternativas, fontes de 16px
em 390px e 14px em 1280px, limites dos campos, ausência de overflow e console
sem erros ou avisos. O viewport não restringe o zoom manual.

- [Medições e console](result.json)
- [Captura em 390px](390.png)
- [Captura em 1280px](1280.png)

As capturas foram inspecionadas visualmente. Esta é uma integração isolada dos
componentes, sem backend ou sessão autenticada. Não comprova a navegação completa
do canal nem o zoom nativo do teclado do Safari em um iPhone físico.

A correção só estará disponível para a aplicação após revisão, publicação de
uma versão do DS e atualização da dependência do frontend. O pacote local não
foi publicado e seu caminho não deve entrar no `package.json` ou lockfile.

## Validação executada

- Typecheck e build de produção: aprovados com o pacote local do DS.
- Suíte completa: 192 arquivos / 1014 testes aprovados.
- Regras do ESLint: aprovadas.
- O mock da enquete preserva os exports reais do DS, incluindo `Input`.
- O teste do feed simula a API `scrollTo` ausente no jsdom; suas asserções de
  comportamento permanecem intactas.

Os checks completos foram executados em uma cópia isolada com finais de linha
LF, evitando os erros de formatação CRLF já encontrados no checkout Windows.
A suíte ainda emite avisos existentes de ambiente/keys; isso não é uma execução
sem avisos. O console da prova visual, registrado no JSON, permaneceu limpo.
