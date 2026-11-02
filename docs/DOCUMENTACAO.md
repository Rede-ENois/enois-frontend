# Inventário de documentação

> **Este arquivo é o inventário do esforço de documentação**: o que já está documentado e o que
> falta. Regras: documentar o que **existe** (implementado e verificado, como manda o
> [`../AGENTS.md`](../AGENTS.md)); nada de segredo ou tática de defesa em texto público (descrever
> comportamento visível, nunca o mecanismo interno de proteção).

## Como usar

- ⬜ pendente · ✅ documentado
- Nova página/feature que surgir entra nesta lista no mesmo commit do código.

## Documentos existentes

| Doc                              | Tema                          | Estado                                      |
| -------------------------------- | ----------------------------- | ------------------------------------------- |
| `arquitetura.md`                 | Camadas, SSR, TanStack Router | ✅ (atualizar com painel de monitoramento)  |
| `rotas.md`                       | Todas as rotas                | ✅ índice completo; detalhes por página: ⬜ |
| `api-modulos.md`                 | Módulos da API consumidos     | 🔄 revisar contra `src/lib/api/*`           |
| `componentes.md`                 | Componentes principais        | 🔄 revisar contra `src/components/*`        |
| `modelos-de-dados.md`            | Tipos e contratos             | 🔄 revisar contra `src/types/*`             |
| `bibliotecas.md`                 | Dependências                  | ✅                                          |
| `configuracao.md`                | Variáveis e ambiente          | ✅ (revisar PWA e push ⬜)                  |
| `jogos-integracao.md`            | Integração de jogos           | ✅                                          |
| `temas.md` (novo)                | 60 coleções × 2 modos         | ✅                                          |
| `push.md` (novo)                 | Web push e service worker     | ✅                                          |
| `monitoramento-painel.md` (novo) | Abas, filtros, logs           | ✅                                          |
| `modo-batata.md` (novo)          | Modo econômico e precedência  | ✅ (medições do build de produção)          |
