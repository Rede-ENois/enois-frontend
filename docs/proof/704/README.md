# Prova visual: #704 (revert de hashtags e retorno das bolhas de Assunto e Tipo)

Captura automatizada em 1280 px e ~390 px conforme diretrizes do `kof-agent-worker`.

## Medições

| Captura | Largura | Overflow | Estado |
| :--- | :--- | :--- | :--- |
| `compositor-1280.png` | 1280 px | 0 px | Compositor aberto com bolha de "Escolha o assunto" (desktop) |
| `compositor-390.png` | 390 px | 0 px | Compositor aberto com bolha de "Escolha o assunto" (mobile) |
| `assunto-aberto-1280.png` | 1280 px | 0 px | Menu de Assunto aberto e rolado (`max-h-72`) (desktop) |
| `assunto-aberto-390.png` | 390 px | 0 px | Menu de Assunto aberto e rolado (`max-h-72`) (mobile) |
| `anexo-aberto-1280.png` | 1280 px | 0 px | Menu de anexo único (+) aberto (desktop) |
| `anexo-aberto-390.png` | 390 px | 0 px | Menu de anexo único (+) aberto (mobile) |

## Validações de Interface
- **Zero overflow horizontal**: `overflow: 0` em todas as larguras de tela.
- **Seletor de Assunto tradicional**:
  - Botão em formato de pílula com borda tracejada e `ChevronDown` quando vazio.
  - Popover com lista completa de assuntos em `max-h-72` e rolagem vertical suave.
- **Console limpo**: sem erros de renderização ou conflitos de layout.
