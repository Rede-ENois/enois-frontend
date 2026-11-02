# #371 — banner do mentor sem recorte

O card do mentor mostrava o banner numa caixa de altura fixa (144px) com `object-cover`. Como o
banner é um cartaz com texto, o recorte tirava informação: sobrava o centro nos dois sentidos,
dependendo da largura da tela.

Agora a imagem manda na proporção (`w-full object-contain`) e só um teto de altura
(`max-h-[min(60vh,22rem)]`) evita que um arquivo quadrado domine o card. O formulário de edição usa
o mesmo componente (`MentorBanner`), com `max-h-40` na prévia.

Medido no app real (Vite em 5174, API interceptada no Chrome headless), com um banner sintético de
1200×400 (`banner-exemplo.png`) com texto nos quatro cantos:

| Largura | Antes (`h-36 object-cover`) | Depois |
| --- | --- | --- |
| 374 | 348×144 — 84px de largura cortados | 348×116 — cartaz inteiro |
| 764 | 704×144 — 99px de altura cortados | 704×235 — cartaz inteiro |

- `antes-374.png` / `depois-374.png` — no telefone, o "TOPO ESQUERDO" aparecia como "SQUERDO".
- `antes-764.png` / `depois-764.png` — no desktop, as faixas de cima e de baixo sumiam.

O "antes" foi capturado aplicando as classes antigas na árvore viva da mesma página, para a
comparação ser do mesmo card.