# #557 — feedback ao tocar na figurinha

No seletor de figurinhas o único retorno visual era `hover`, que não existe no toque: em tela
pequena a pessoa não sabia se acertou a figurinha antes de o texto mudar.

A célula agora responde também no estado apertado (`active`): fundo `surface-2` e anel de 2px na cor
`ring`, os mesmos tokens do foco do teclado.

Medido no app real (Vite em 5174) a 390 px, com o `:active` forçado pelo CDP (`CSS.forcePseudoState`)
— screenshot comum não captura esse estado.

|                           | Antes                          | Depois                             |
| ------------------------- | ------------------------------ | ---------------------------------- |
| Célula a 390 px, apertada | idêntica à solta — sem retorno | fundo `surface-2` + anel `ring`    |
| Tamanho da célula         | 44×44                          | 44×44 (o anel não desloca a grade) |

- `antes-390.png` — nenhum retorno no clique.
- `depois-390.png` — a célula apertada (a 4ª da segunda linha) fica destacada.
