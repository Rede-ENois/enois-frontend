# Novo avanço da QA: erro recuperável e sincronização da caixa

## Composição e preservação

- Frontend exercitado: `736d0b83c85d981f38b6337da455a94fdded6a16`.
- QA incorporada: `b57e10524a2ab239eb181e42b9988ed8e4d1ba62`, incluindo as entregas de erro
  recuperável em penalidades (#962) e sincronização da caixa com os mesmos identificadores (#965).
- O head publicado anterior `e80d75ccc3cf3cf429a803544ec9f13d5cebd2ae` permanece ancestral.
- DS local continua em `aeb03aec9e50e19e2ef4ffb98645d475d6f43440`, com o mesmo pacote
  SHA-256 `966404dd1b96c5545c3f630299193490e38eb61a6d8bd249cb9d54faa460c4ce`.

A rota mantém o container compartilhado e sua view real do DS. A regressão da QA foi
preservada: falha mostra erro, nunca histórico vazio, e **Tentar novamente** faz uma segunda
consulta e recupera o estado. Os testes usam a mensagem efetiva da view do DS; os textos
legados da QA permanecem disponíveis, sem chaves duplicadas introduzidas pelo merge.

A sincronização da caixa e seus novos testes/tipos foram preservados. Não houve mudança de
política, autorização, relógio, atualização ao entrar ou bloqueio de submissão duplicada.

## Provas repetidas nesta composição

- Lint, tipos, **1.610 testes em 279 arquivos**, build, regras de ESLint e baseline contra a
  QA incorporada aprovados. Os **1.578 arquivos de código/configuração** exercitados foram
  conferidos no commit depois dos hooks.
- Navegador do consumidor real com **API simulada e dados fictícios**: 26 verificações em
  390 × 900 e 1280 × 900, claro/escuro, sem overflow ou erros inesperados.
- As quatro capturas selecionadas foram produzidas novamente. Seus bytes são idênticos,
  por SHA-256, às quatro imagens já inspecionadas e versionadas nesta pasta. Portanto não
  são necessárias cópias duplicadas dos mesmos pixels:
  - [Histórico desktop escuro](./historico-1280-dark.png).
  - [Conta suspensa mobile escura](./suspensa-390-dark.png).
  - [Erro mobile claro](./erro-390-light.png).
  - [Histórico de sanção removida desktop claro](./removida-1280-light.png).

## Limitações

Continua sendo prova com tarball local não publicado, não instalação limpa pelo lockfile.
Publicação RC/final do DS, atualização coordenada da dependência, `npm ci`, CI autorizado e
revisão humana permanecem pendentes. O backend segue uma reconciliação adicional de sua
migração após outro avanço da QA; estas provas não são um novo E2E com esse backend.
Os resultados anteriores em [README.md](./README.md) permanecem históricos e identificados.
