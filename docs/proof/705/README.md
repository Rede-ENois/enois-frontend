# Prova visual: #705 (saldo em faíscas e fagulhas)

O contrato pede ~390 px e ~1280 px para mudança de texto visível. Esta PR muda como o saldo é lido,
então a captura mostra a carteira e o formulário de pagamento com o saldo de **101,830 faíscas** — o
mesmo exemplo do pedido.

## Como foi medido

`shot-705.mjs` sobe um backend falso em `127.0.0.1:8127` (o SSR do dev chama `BACKEND_TARGET`
direto) e dirige o Chrome headless por CDP, sem dependência nova — o mesmo padrão do
`docs/proof/611/shot-611.mjs`.

1. Semeia a sessão (`session_active`, `session_id`, `current_user`) em `/sobre`.
2. Abre `/carteira`; o mock responde `GET /carteira` com `balance: 101830` milésimos.
3. Captura a carteira com o saldo, a explicação do decimal e o exemplo.
4. Abre "Pagar", digita `101,83` no campo de valor e captura a prévia que o formulário mostra antes
   de confirmar.

Todo nome e valor do mock é falso.

## Resultado

`result.json` traz, por captura, o texto do saldo, se a explicação e o exemplo aparecem, a largura
e a quantidade de linhas da explicação e o estouro do documento.

| Captura             | Saldo na tela              | Explicação | Exemplo | Largura | Linhas | Estouro |
| ------------------- | -------------------------- | ---------- | ------- | ------- | ------ | ------- |
| `carteira-1280.png` | `101 faíscas 830 fagulhas` | sim        | sim     | 624 px  | 3      | 0 px    |
| `carteira-390.png`  | `101 faíscas 830 fagulhas` | sim        | sim     | 318 px  | 5      | 0 px    |

No formulário de pagamento, em 1280 e 390 px, a prévia do valor é a mesma:

> 101 faíscas 830 fagulhas ≈ R$ 10,183 na cotação de referência

O saldo cabe na largura da tela nas duas medidas e a explicação quebra em 3 linhas a 1280 px e 5 a
390 px, sem estourar a página.
