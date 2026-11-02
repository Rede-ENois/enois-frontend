# #566 — a aba "Itens" da Aparência equipa molduras, emblemas e banners

A Aparência (o diálogo de "Aparência" no próprio perfil) abre em **Tema global**, com a segunda aba
**Identidade** e a terceira **Itens**. A aba Itens mostra o que a pessoa já comprou, agrupado pelo
espaço que ocupa — os ativos no perfil em cima, com **Tirar**, e o resto abaixo por tipo, com
**Equipar** — sem precisar passar pela Carteira.

Quem não comprou nada ainda vê o vazio com o caminho para a loja: "Nada comprado ainda. O que você
comprar na loja aparece aqui." e o botão **Ir para a loja**, que fecha o diálogo e abre a loja da
Carteira.

A aba só existe para conta com sessão. Sem sessão o diálogo mostra as duas abas de tema, como antes.

Medido no app real (Vite em 5175), com a sessão simulada no `localStorage` e um backend de mentira
local apontado por `BACKEND_TARGET` (nenhuma conta real, nenhum cookie de sessão de verdade):

| Largura | Com itens comprados                         | Sem nenhum item                              | Largura do documento |
| ------- | ------------------------------------------- | -------------------------------------------- | -------------------- |
| 390     | Aurora em "Ativos no perfil (Tirar)", Estrela e Noite em "Seus itens (Equipar)" | Nada comprado + "Ir para a loja" | 390 — sem rolagem lateral |
| 1280    | o mesmo, numa coluna central                | o mesmo                                       | 1280 — sem rolagem lateral |

- `itens-390-comitens.png` e `itens-1280-comitens.png` — a aba Itens com três itens.
- `itens-390-semitens.png` e `itens-1280-semitens.png` — a aba Itens numa conta sem compras.

Como reproduzir: `node shot-566.mjs`, com o app em `http://127.0.0.1:5175` e
`BACKEND_TARGET=http://localhost:5199` (o roteiro sobe o backend de mentira nessa porta, porque o
SSR do dev chama o backend direto). O script semeia `session_active` e `enois_auth`, abre
`/perfil/melissa`, clica em "Aparência", ativa a aba "Itens" (Radix ativa no `mousedown`, então o
clique é despachado como o navegador faz) e lê a aba marcada, os itens e a largura do documento.

A medida registrada está em `resultado.json` ao lado das capturas.
