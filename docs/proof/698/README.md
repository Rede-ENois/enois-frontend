# Prova visual: #698 (texto próprio para as falhas de envio de mídia)

O contrato pede ~390 px e ~1280 px para mudança que altera texto visível. Esta PR troca a mensagem
técnica do servidor pela explicação do app no envio de arquivo, então a captura mostra o estado de
erro real do compositor do feed.

## Como foi medido

`shot-698.mjs` sobe um backend falso em `127.0.0.1:8125` (o SSR do dev chama `BACKEND_TARGET`
direto) e dirige o Chrome headless por CDP, sem dependência nova — o mesmo padrão do
`docs/proof/611/shot-611.mjs`.

1. Semeia a sessão (`session_active`, `current_user`) em `/sobre`.
2. Abre `/feed` e espera o handler do input de arquivo existir (antes da hidratação o `change` é
   engolido).
3. Coloca um PNG no input escondido. O envio começa na seleção do arquivo, e o mock responde
   `POST /media/uploads` com **413 `MEDIA_TOO_LARGE`** e a mensagem técnica do servidor
   ("Erro interno inesperado ao enviar para o bucket de midia.").
4. O selo de erro aparece sobre a prévia da mídia — é a caixa estreita onde a frase longa poderia
   quebrar linha no mobile, que foi o ponto levantado na revisão.

Cada estado é lido e capturado em 1280 e 390 px. Todo nome e valor do mock é falso.

## Resultado

`result.json` traz, por captura, o texto do selo, se a mensagem do servidor vazou, largura, altura,
entrelinha, quantas linhas o texto ocupa e o estouro do documento.

| Captura           | Texto do app | Vaza mensagem do servidor | Largura | Linhas | Estouro da página |
| ----------------- | ------------ | ------------------------- | ------- | ------ | ----------------- |
| `banner-1280.png` | sim          | não                       | 566 px  | 3      | 0 px              |
| `banner-390.png`  | sim          | não                       | 316 px  | 4      | 0 px              |

O texto medido nas duas larguras:

> Não conseguimos processar esse arquivo: ele é grande demais para este tipo de envio. Diminua o
> tamanho e tente de novo.

A frase quebra em 3 linhas a 1280 px e em 4 a 390 px, sem estourar a largura da página em nenhuma
das duas.
