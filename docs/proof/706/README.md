# Prova Visual — Preferências de Feed (#706)

Evidências de renderização e estado do interruptor na rota `/conta/preferencias-feed` nos viewports desktop (1280px) e mobile (390px).

## Capturas

- `feed-prefs-desligado-1280.png` / `feed-prefs-desligado-390.png`: Estado inicial carregado (`switchChecked: false`, `hasHint: true`).
- `feed-prefs-ligado-1280.png` / `feed-prefs-ligado-390.png`: Estado pós-clique (`switchChecked: true`, `hasHint: true`).

## Métricas registradas (`result.json`)

- **Overflow horizontal:** 0px em ambos os viewports.
- **Erros de console:** 0 erros capturados durante a sessão.
- **Interatividade:** O switch reflete com sucesso o toggle entre `false` e `true`.
