# Prova visual: #598 (silenciar por prazo)

O contrato da casa pede ~390 px e ~1280 px em toda tela alterada. Este PR muda superfície visível
(diálogo novo, selo no perfil, linha de vencimento em `/silenciados`), então a captura roda o app
real com sessão semeada, não stories do DS.

## Como foi medido

`shot-598.mjs` sobe um backend falso em `127.0.0.1:8123` e o Chrome headless por CDP. Ele:

1. Semeia a sessão (`session_active`, `current_user`) em `/sobre`.
2. Abre `/perfil/fulana` e clica em **Silenciar** — estado A, o menu de prazos.
3. Confirma o silêncio (o POST vai para o backend falso, que passa a devolver `muted: true` e
   `muteExpiresAt`), e o perfil mostra o selo.
4. Clica em **Remover silêncio** — estado B, a janela com a legenda de vencimento.

Em cada estado lê o texto do diálogo, o estado do radiogroup (`aria-checked`, `tabIndex`) e
`scrollWidth − clientWidth`. Todo nome e valor é falso.

```bash
node docs/proof/598/shot-598.mjs
```

## Resultado

| Captura            | Estado         | 390 px        | 1280 px       |
| ------------------ | -------------- | ------------- | ------------- |
| `dialogo-*.png`    | menu de prazos | 0 de overflow | 0 de overflow |
| `silenciada-*.png` | já silenciada  | 0 de overflow | 0 de overflow |

Visto na tela:

- **Menu de prazos:** "24 horas", "72 horas", "1 semana", "Sempre (até remover)" em 2×2, com
  "24 horas" marcado. Um item no tab order (`tabIndex: 0`) e os outros em `-1`, como manda o padrão
  WAI-ARIA de radiogroup; as setas andam entre as opções.
- **Já silenciada:** "Você silenciou esta pessoa até 09/11/2026. O conteúdo dela volta a aparecer
  sozinho nessa data." — a data vem de `muteExpiresAt`, não é texto fixo.
- **Selo no perfil:** "Você silenciou esta pessoa. O conteúdo dela está escondido para você."

O `result.json` guarda a leitura de cada captura.
