# #555 — a aba Recentes desenha a figurinha mesmo sem índice de catálogo

O seletor de figurinhas tem duas abas: **Recentes** (as últimas 24 escolhidas neste aparelho) e
**Todas** (a lista completa, com busca e paginação). A lista recente só guardava o código da
figurinha e resolvia a imagem pelo índice do catálogo — o mapa código → imagem que o texto dos posts
usa.

Esse índice é conveniência: a primeira pintura sai da cópia local e a busca em segundo plano
revalida. Quando ele não tem o que responder (primeira visita, cópia expirada, backend sem índice),
a aba sumia da tela e o seletor voltava para "Todas" — a pessoa escolhia a mesma figurinha e não a
reencontrava.

Agora a miniatura é guardada **junto com o código**. A aba Recentes desenha direto do que está no
aparelho; o índice só entra como reserva para entradas salvas antes da mudança. O caminho salvo
passa pela mesma validação da cópia do índice: só imagem do nosso proxy (`/emotes/image/...`), nunca
URL de terceiro.

Uma figurinha que saiu do catálogo continua na lista, com a miniatura guardada. Sem miniatura e sem
índice, é a célula que fica sem imagem — a lista não desaparece.

Medido no app real (Vite em 5174), com a sessão simulada no `localStorage` e a API interceptada no
Chrome headless — nenhuma conta real, nenhum cookie de sessão de verdade. **O índice do catálogo
está vazio neste roteiro de propósito**, que é o caso que quebrava:

| Largura | Sem nenhuma usada (abre em Todas) | Depois de escolher uma (abre em Recentes)       | Largura do documento       |
| ------- | --------------------------------- | ----------------------------------------------- | -------------------------- |
| 390     | 6 células, busca visível          | 1 célula (KEKW), busca oculta, sem "Carregando" | 390 — sem rolagem lateral  |
| 1280    | 6 células, busca visível          | 1 célula (KEKW), busca oculta, sem "Carregando" | 1280 — sem rolagem lateral |

- `seletor-390.png` — seletor reaberto no telefone, na aba Recentes, com a figurinha escolhida.
- `seletor-1280.png` — o mesmo no desktop.

Como reproduzir: `node shot-555.mjs`, com o app em `http://127.0.0.1:5174`. O script abre o Chrome
headless, semeia `session_active` e `enois_auth` (a pista de sessão), limpa
`rede:emotes:recent:v1`, intercepta `/api/me`, `/api/emotes` e as rotas de apoio, devolve índice
vazio em `/api/emotes/index`, desenha as miniaturas como SVG local (nada sai para a rede), abre o
seletor pelo botão "Figurinhas", escolhe uma figurinha, recarrega e abre de novo. A leitura registra
a aba ativa, as células e se o diálogo ainda diz "Carregando".

Os testes cobrem o que a captura não vê: `recent-emotes.test.ts` (ordem, deduplicação, limite,
entrada adulterada, imagem fora do proxy) e `emote-picker-dialog.test.tsx` — inclusive
**"Recentes não depende do índice do catálogo para desenhar a figurinha"**, que falhava antes da
mudança (a aba sumia com o índice vazio).
