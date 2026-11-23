# #1100 — figurinha no meio do texto

No comentário, a figurinha saía no desenho da **mídia anexada**: 256×256, com moldura e margem
vertical, e ela quebrava a frase em três pedaços. Com as regras de **endereço** de
`src/styles.css` (`p img[src*="/emotes/image/"]` para o catálogo, `img.rounded-xl[src*="/emojis/enois/"]`
para o pacote É Nóis) ela cabe na linha como um emote de verdade, e um parágrafo que é só a
figurinha ganha o tamanho destacado.

## Como a captura foi feita

1. `render.test.tsx.txt` monta o `RichText` real do app (o mesmo componente da tela: `RichText` do
   front → `RichText` do design system) em seis cenários, com o índice de figurinhas vindo do
   `fetch` falso no mesmo formato de `GET /emotes/index`. Copiado para `src/prova-1100.test.tsx` e
   rodado com `npx vitest run`, ele grava a marcação em `/tmp/prova-1100/corpo.html` — é o
   `render.html` deste diretório. **A marcação é a que a `0.43.1` publicada de fato emite**: a
   figurinha do catálogo sai com a classe do design system (`inline-block h-[1.75em] …`) e a do
   pacote É Nóis sai como mídia (`my-1 max-h-96 rounded-xl …`) — não há classe `enois-figurinha`,
   que só existe na `0.44.0`, ainda não publicada.
2. `shot-1100.mjs` renderiza essa marcação numa página que carrega o `styles.css` **compilado
   desta branch** (`npx vite build` → `.vercel/output/static/assets/styles-*.css`, copiado para
   `styles.css`) e as imagens locais: o joinha É Nóis (`public/emojis/enois/like.webp`) e um emote
   real do pacote no lugar do proxy (`/emotes/image/BTTV/…`). Nada de rede na captura.
3. Screenshot no Chrome headless via CDP em 1280 e 390 de largura, página inteira,
   `deviceScaleFactor: 2`.
4. O "antes" é a **mesma** marcação com as classes da figurinha removidas: é exatamente o que a
   tela desenha sem as regras de endereço, então a comparação é do mesmo texto, mesma fonte e
   mesma largura.

## Medido (altura do parágrafo / largura da imagem, px)

| Cenário                                        | 1280 antes | 1280 depois | 390 antes | 390 depois |
| ---------------------------------------------- | ---------: | ----------: | --------: | ---------: |
| frase com a figurinha no meio                  |      76/28 |       76/28 |     100/28 |      100/28 |
| parágrafo só com a figurinha                   |      28/28 |       28/28 |      28/28 |       28/28 |
| parágrafo só com a figurinha da É Nóis         |    256/256 |       97/88 |    256/256 |       97/88 |
| figurinha da É Nóis no meio da frase           |    304/256 |      121/88 |    328/256 |      121/88 |
| texto anterior ao prefixo, código solto (KEKW) |      28/28 |       28/28 |      28/28 |       28/28 |
| frase sem figurinha (controle)                 |       48/– |        48/– |      96/– |       96/– |

A figurinha da É Nóis passa de 256×256 para 88×88 nas duas larguras e não transborda
horizontalmente em nenhuma delas (`estoura: false` em todos os cenários medidos).

- `antes-1280.png` / `depois-1280.png` — no desktop, a frase da É Nóis caía em três linhas.
- `antes-390.png` / `depois-390.png` — no telefone, o joinha ocupava quase uma tela.

## As regras de endereço fazem o trabalho

A figurinha do **catálogo** já sai da `0.43.1` com a classe do design system (tamanho do texto),
mas a do **pacote É Nóis** sai como mídia anexada (`rounded-xl`, 256px). A regra de endereço pega
os dois casos e ainda cobre texto antigo. Medido numa página só com as regras desta branch:

| Imagem chegando como `rounded-xl` (mídia) | antes | depois |
| ----------------------------------------- | ----: | -----: |
| catálogo (`/emotes/image/…`)              |   256 |     28 |
| pacote É Nóis (`/emojis/enois/…`)         |   256 |     88 |

É por isso que a classe `enois-figurinha` (a prop `figurinha` do design system) **não** entra
aqui: ela só existe na `0.44.0`, que ainda não foi publicada. Enquanto o pacote publicado for a
`0.43.1`, quem decide o tamanho é o seletor de endereço.
