# Prova visual: #699 (aviso de novas features e mudanças de design)

Captura automatizada em 1280 px e ~390 px conforme diretrizes do `kof-agent-worker`.

## Medições

| Captura | Largura | Overflow | Estado |
| :--- | :--- | :--- | :--- |
| `modal-1280.png` | 1280 px | 0 px | Modal de novidades aberto no feed com passos e botão Experimentar (desktop) |
| `modal-390.png` | 390 px | 0 px | Modal de novidades em tela cheia mobile com scroll interno (mobile) |
| `novidades-1280.png` | 1280 px | 0 px | Página /novidades completa com histórico e toggle (desktop) |
| `novidades-390.png` | 390 px | 0 px | Página /novidades responsiva no mobile (mobile) |

## Validações de Interface
- **Zero overflow horizontal**: `overflow: 0` em todas as larguras.
- **Responsividade do modal**: `max-h-[90vh]` com lista rolável e rodapé visível em 390 px.
- **Página /novidades**: listagem de releases históricas, passos de "Como usar" e botão de ação.
- **Console limpo**: sem erros de renderização ou conflitos de layout.
