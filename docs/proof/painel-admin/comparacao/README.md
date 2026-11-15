# Painel administrativo: comparação da etapa anterior

Capturas reais produzidas localmente em 14/11/2026, com a mesma API simulada e os mesmos dados fictícios. Antes à esquerda; depois à direita.

- **Antes:** revisão Git `1820fe0bcba8de4630318a4c13a6c5d41cae90e8`, anterior ao refinamento do painel. A imagem foi reproduzida posteriormente: não é captura histórica salva antes da edição.
- **Depois:** cópia isolada do WIP do painel da etapa anterior, ainda sobre a branch de transparência. Não representa a nova composição reconciliada com a QA; as capturas desta última estão em [`../qa/`](../qa/README.md).
- Ambas usaram o mesmo DS compatível e dependências instaladas. Não foi reconstruído todo o ambiente histórico de dependências.
- Tema claro, idioma pt-BR, fuso America/Sao_Paulo, viewports 1280 × 900 e 390 × 900, mesma conta administrativa fictícia e lote de três denúncias.
- Nenhum voto ou punição foi enviado durante esta comparação.
- A rota anterior foi conferida contra o Git, desconsiderando somente LF/CRLF; a rota nova era idêntica ao WIP fotografado. Os originais foram preservados em cópias isoladas.

## Seleção para avaliação

- `comparacao-1280-topo.png`: visão geral no desktop.
- `comparacao-390-topo.png`: início da página no celular.
- `comparacao-390-denuncia.png`: ações da denúncia no celular.

As composições preservam os pixels sem redimensionar as capturas; somente rótulos foram acrescentados. No celular, a nova versão ocupa mais espaço vertical para separar controles e decisões. As imagens foram inspecionadas antes da publicação e contêm apenas dados sintéticos.

Esta comparação demonstra diferenças de interface da etapa anterior. Não comprova integração com backend real, estado de produção, instalação limpa ou aprovação para merge.
