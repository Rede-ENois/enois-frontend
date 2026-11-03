# Visual proof: #611 (lição de bons modos ao ter o arquivo barrado)

O contrato pede ~390 px e ~1280 px nas telas alteradas. Este PR mexe no compositor do feed (prévia
bloqueada) e no aviso educativo que abre quando a moderação recusa a imagem, então a captura roda o
app real com sessão semeada, e não story do DS.

## Como foi medido

`shot-611.mjs` sobe um backend falso em `127.0.0.1:8124` (o SSR do dev chama `BACKEND_TARGET`
direto) e dirigiu o Chrome headless pelo Playwright. O mock responde `POST /media/uploads` com um
`uploadUrl` **same-origin** (`/api/storage/prova`): é o único caminho em que a recusa chega ao
compositor como `ApiError` e vira a lição — num PUT cross-origin para o S3, o erro não carrega o
`code`.

1. Semeia a sessão (`session_active`, `current_user`) em `/sobre`.
2. Abre `/feed` e espera o handler do input de arquivo existir (antes da hidratação o `change` é
   engolido — foi o que travou a primeira tentativa).
3. Seleciona um PNG pelo input escondido; o compositor abre, o PUT volta 422
   `IMAGE_CONTENT_NOT_ALLOWED` e a lição aparece sozinha.
4. Fecha pelo rodapé, mede a prévia bloqueada, e clica no botão dela para provar que reabre.

Cada estado é lido e capturado em 1280 e 390 px. Todo nome e valor do mock é falso.

## Resultado

`result.json` traz, por captura, `dialogOpen`, as quatro regras, largura/altura do diálogo, quanto
ele rola por dentro (`scrollHeight - clientHeight`) e o estouro do documento.

| Captura              | Diálogo      | Rola por dentro | Estouro da página |
| -------------------- | ------------ | --------------- | ----------------- |
| `licao-1280.png`     | 486 × 402 px | 0 px            | 0 px              |
| `licao-390.png`      | 358 × 465 px | 0 px            | 0 px              |
| `previa-feed-1280`   | —            | —               | 0 px              |
| `previa-feed-390`    | —            | —               | 0 px              |
| `reabre-pela-previa` | 512 × 424 px | 0 px            | 0 px              |

Sem estouro horizontal em nenhuma largura e sem scroll dentro do diálogo. Visto na tela: as quatro
regras numeradas com o tom de cada uma, o selo "Advertência no Boletim", o rodapé "Entendido,
Professor!" e, no compositor, a prévia "Imagem ocultada" com o botão "Ver aula de bons modos" —
esse botão é quem reabre a lição depois que o rodapé a fecha.

## O que a captura encontrou

Na primeira rodada a 390 px o subtítulo saía cortado no meio da palavra ("...barrado pela mo…"):
o `DialogDescription` tinha `truncate`. Trocado por quebra normal, o texto passa a ocupar duas
linhas e o diálogo cresce 17 px, ainda longe do `max-h-[90dvh]`.

## Reproduzir

```bash
BACKEND_TARGET=http://127.0.0.1:8124 npx vite dev --port 5178   # em um terminal
node docs/proof/611/shot-611.mjs
```
