# Prova visual — PR #551 (seletor de tipo no mobile)

App real (TanStack Start) local, backend local, sessão de conta de teste, Chrome headless.
Assunto **Empreendedorismo** no feed (o caso que empurra o seletor para a segunda linha) e
compositor da comunidade sem assunto. Painel aberto, DPR 1.

| Arquivo | Tela | Viewport | Painel (x..right, y..bottom) |
| --- | --- | --- | --- |
| `feed-390.png` | feed | 390×844 | 30..382, 410..582 |
| `feed-320.png` | feed | 320×700 | 8..312, 410..662 |
| `feed-1280.png` | feed | 1280×900 | 487..839, 360..532 |
| `comunidade-390.png` | comunidade | 390×844 | 30..382, 522..734 |

Medições (`getBoundingClientRect`, painel aberto):

- **feed 390**: campo de texto termina em `y=238`, Agendar/Publicar em `y=407`, painel começa em
  `y=410`; `scrollWidth === clientWidth === 390`.
- **feed 320**: campo em `y=238`, Publicar em `y=386`, painel começa em `y=410`; painel dentro da
  tela (8..312). O documento já media `scrollWidth 329` **com o painel fechado** — o estouro vem do
  menu da conta no cabeçalho, anterior a esta PR.
- **feed 1280**: painel 487..839 dentro de 1280; campo em `y=228`, ações em `y=357`, painel em
  `y=360`; `scrollWidth === clientWidth`.
- **comunidade 390**: campo termina em `y=462`, Publicar em `y=519`, painel começa em `y=522`;
  `scrollWidth === clientWidth === 390`.
