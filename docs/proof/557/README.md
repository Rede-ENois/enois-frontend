# #557 — feedback ao tocar na figurinha

No seletor de figurinhas o único retorno visual era `hover`, que não existe no toque: em tela
pequena a pessoa não sabia se acertou a figurinha antes de o texto mudar.

A célula agora responde também no estado apertado (`active`): fundo `surface-2` e anel de 2px na cor
`ring`, os mesmos tokens do foco do teclado.

Medido no app real (Vite em 5174, com o CSS compilado servido pela própria página) a 390 px e a
1280 px, com o `:active` forçado pelo CDP (`CSS.forcePseudoState`) — screenshot comum não captura
esse estado.

A célula apertada é a `#fig-9`, a **4ª da segunda linha** (laranja): nas capturas de "depois" é a
única com fundo mais claro e anel roxo.

| Largura | Antes — célula apertada        | Depois — célula apertada        |
| ------- | ------------------------------ | ------------------------------- |
| 390     | idêntica à solta — sem retorno | fundo `surface-2` + anel `ring` |
| 1280    | idêntica à solta — sem retorno | fundo `surface-2` + anel `ring` |

Tamanho da célula antes e depois: 53,66×44 a 390 px e 49×44 a 1280 px — o anel não desloca a grade.

Capturas de página inteira:

- `antes-390.png` / `depois-390.png` — telefone.
- `antes-1280.png` / `depois-1280.png` — desktop.

Recortes com zoom 3× na célula apertada (é aqui que a diferença se vê de perto):

- `antes-390-zoom.png` / `depois-390-zoom.png` — telefone.
- `antes-1280-zoom.png` / `depois-1280-zoom.png` — desktop.

Como reproduzir (`node shot-557.mjs`, com o app em `http://127.0.0.1:5174` e o Chrome headless
aberto em `--remote-debugging-port=9222`):

1. a página pega o CSS compilado do próprio app (`/entrar`), então as cores são as do tema real;
2. monta uma grade de 16 células com as classes do componente e um desenho em SVG por célula;
3. `Emulation.setDeviceMetricsOverride` fixa 390 e depois 1280;
4. `CSS.forcePseudoState` força `:active` na `#fig-9`;
5. `DOM.getBoxModel` mede a célula antes/depois e `Page.captureScreenshot` salva a página e o recorte
   com `scale: 3`.

O teste de componente (`emote-picker-dialog.test.tsx`) só garante que as classes existem; a prova de
que o toque se vê na tela é esta captura.
