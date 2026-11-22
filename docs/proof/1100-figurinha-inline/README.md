# #1100 — figurinha no meio do texto

No comentário, a figurinha saía no desenho da **mídia anexada**: 256×256, com moldura e margem
vertical, e ela quebrava a frase em três pedaços. Com a classe `enois-figurinha` (design system,
PR #388) ela cabe na linha como um emote de verdade, e um parágrafo que é só a figurinha ganha o
tamanho maior da regra `p:has(> .enois-figurinha:only-child)`.

## Como a captura foi feita

1. `render.test.tsx.txt` monta o `RichText` real do app (o mesmo componente da tela: `RichText` do
   front → `RichText` do design system → `figurinha={{ classe: "enois-figurinha", ehFigurinha }}`)
   em seis cenários, com o índice de figurinhas vindo do `fetch` falso no mesmo formato de
   `GET /emotes/index`. Copiado para `src/prova-1100.test.tsx` e rodado com `npx vitest run`, ele
   grava a marcação em `/tmp/prova-1100/corpo.html` — é o `render.html` deste diretório.
2. A mesma marcação foi embrulhada numa página que carrega o `styles.css` do design system com a
   classe `enois-figurinha` (build do PR #388) e as imagens locais: o joinha É Nóis
   (`public/emojis/enois/like.webp`) e uma das figurinhas do catálogo usada também como retrato
   do proxy (`/emotes/image/BTTV/…`). Nada de rede na captura.
3. Screenshot no Chrome headless (playwright-core, `/usr/bin/google-chrome`) em 1280 e 390 de
   largura, página inteira, `deviceScaleFactor: 2`.
4. O "antes" é a **mesma** marcação com o atributo `class` da figurinha removido: é exatamente o
   que o app desenha sem a prop, então a comparação é do mesmo texto, mesma fonte e mesma largura.

## Medido (altura do parágrafo, px)

| Cenário                                        | 1280 antes | 1280 depois | 390 antes | 390 depois |
| ---------------------------------------------- | ---------: | ----------: | --------: | ---------: |
| frase com a figurinha no meio                  |         72 |          72 |        96 |         96 |
| parágrafo só com a figurinha                   |        256 |          48 |       256 |         48 |
| parágrafo só com a figurinha da É Nóis         |        256 |          48 |       256 |         48 |
| figurinha da É Nóis no meio da frase           |        304 |          72 |       328 |         72 |
| texto anterior ao prefixo, código solto (KEKW) |        304 |          48 |       304 |         48 |
| frase sem figurinha (controle)                 |         72 |          72 |        96 |         96 |

A figurinha no meio da frase passa de 256×256 para 48×48 nas duas larguras e não transborda
horizontalmente em nenhuma delas (`estoura: false` em todos os cenários medidos).

- `antes-1280.png` / `depois-1280.png` — no desktop, a frase da É Nóis caía em três linhas.
- `antes-390.png` / `depois-390.png` — no telefone, o joinha ocupava quase uma tela.

A captura usa o CSS do design system já com a classe. Enquanto o front não puxar `^0.43.2` com a
classe, a tela continua com o desenho antigo — é por isso que a prop e a versão sobem juntas.
