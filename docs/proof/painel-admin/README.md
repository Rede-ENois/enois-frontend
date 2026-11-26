# Prova histórica local: painel administrativo e decisão emergencial

> **Histórico, não validação da integração atual.** Este diretório foi portado da árvore
> WIP de moderação baseada em `1820fe0bcba8de4630318a4c13a6c5d41cae90e8`.
> Os resultados, capturas, `report.json` e `source-inventory.json` abaixo pertencem
> àquela composição. A preparação sobre a QA está documentada em
> [INTEGRACAO-QA.md](INTEGRACAO-QA.md); os gates e as novas capturas concluídas estão
> na [prova da composição reconciliada](qa/README.md). Os números históricos abaixo
> não substituem essa medição atual nem resolvem suas pendências de liberação.

Verificação em 14/11/2026. A árvore é WIP nos worktrees de moderação, sem commit,
publicação de pacote, push, merge ou deploy nesta execução. Os hashes das fontes
exercitadas estão em `source-inventory.json`; documentação e estas capturas foram
adicionadas depois dos gates, sem nova mudança funcional.

## Mudanças verificadas

- Navegação agrupada em coluna no desktop e seletor no celular, com busca de áreas.
- Seleção em `?aba=...`, preservada no reload e no histórico do navegador.
- Fila com busca, filtros combináveis, contagem do lote e estados separados de
  carregamento, vazio, recorte vazio e erro com nova tentativa.
- Voto coletivo e ação administrativa direta em blocos distintos. **Punir agora**
  exige confirmação de alvo e efeito; abrir ou cancelar não envia uma punição.
- Erro de uma tentativa não acompanha outra confirmação. Pendência impede repetição.
- Modo pânico inativo recolhido; estado ativo ou incerto fica visível. Falha de
  consulta mostra alerta e bloqueia alterações até nova confirmação do estado.
- Fluxo coletivo e quórum não tiveram regras alteradas.

## Gates executados

| Camada                          | Comandos                                                                                                                                                 | Resultado observado                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Design system                   | `npm run lint`, `npm run typecheck`, `npm test`, `npm --script-shell=bash run build`, `npm run test:dist`, `npm --script-shell=bash run build-storybook` | Cadeia completa terminou com código 0; entrypoints e Storybook construídos                                                         |
| Frontend com tarball atualizado | `npm run lint`, `npm run typecheck`, `npm test -- --reporter=default --reporter=json --outputFile=<scratch>/frontend-tests-final.json`, `npm run build`  | Código 0; **1450 testes aprovados**, zero falhas ou testes pendentes                                                               |
| Backend                         | `./mvnw -DskipTests compile` e `./mvnw '-Dtest=com.socialcoisa.rede.moderation.**.*Tests' test`                                                          | Compilação verde; execução final do recorte de moderação com **192 testes**, zero falhas, erros ou skips                           |
| Backend, dentro do recorte      | `SanctionFlowTests`                                                                                                                                      | **11 testes**, zero falhas, erros ou skips; JSON HTTP, acesso recusado, efeitos persistidos, autoria humana e repetição sequencial |

O frontend manteve 14 avisos de lint, sem erros. Há avisos de `act(...)` em testes
legados e de bundles/diretivas no build; não foram suprimidos para obter o verde.
Não foi executada novamente a suíte inteira de todos os domínios Java.

### Regressões vermelho/verde desta continuação

1. Erro de punição seguido de cancelamento e abertura de advertência: falhava ao
   encontrar um alerta herdado; após a correção, os dez testes da fila passaram.
2. Consulta do modo pânico em erro com `active` falso e verdadeiro: ambos os novos
   casos falharam antes da correção; os treze testes da view passaram depois dela.
3. A primeira execução ampliada do backend encontrou duas falhas na triagem em lote.
   O relógio fixo de toda a classe envelhecia suas fixtures na base compartilhada.
   O instante controlado foi limitado ao teste de autoria humana, com reset após o
   cenário, sem aumentar o lote nem afrouxar asserções. A execução conjunta final
   dos 192 testes passou.

## Pacote e consumidor reais

Foi gerado tarball da árvore local do DS, mantendo a versão-base `0.34.1`, e instalado
no worktree do frontend com `--no-save --package-lock=false --no-audit --no-fund`.
Não há caminho local nem versão futura no manifesto/lockfile. A comparação de **2558
arquivos de `dist`** entre o tarball final e o pacote instalado encontrou **zero
divergências**, incluindo `compact`, `error`, `onRetry` e `actionError` opcional.
Os testes do container usam a view real do pacote e substituem somente o transporte.

Uma instalação foi bloqueada por binário nativo em uso. A origem foi uma junction
que fazia uma cópia de revisão compartilhar `node_modules`; o servidor antigo da
própria tarefa foi encerrado antes da instalação final, sem interromper outros projetos.
Uma tentativa inicial de navegador encontrou cache de otimização do Vite obsoleto;
a execução registrada abaixo ocorreu após instalação, build e carregamento limpos.

## Navegador

Chromium no frontend real, com API **explicitamente simulada** e contas/conteúdo
fictícios. Não é E2E com backend real nem ação em produção.

Resultado do script final, código de saída 0:

- **54 verificações**, incluindo **28 inspeções renderizadas**.
- Viewports de **390px e 1280px**, tema padrão nos modos claro e escuro.
- **Zero overflow horizontal**, zero erros de página e zero erros inesperados de console.
- Contraste mínimo dos textos inspecionados: **6,25:1**.
- Carregamento, vazio, erro, retry, texto longo, filtros combinados e limpeza.
- Confirmação pelo teclado, cancelamento, devolução de foco, envio único,
  atualização da fila e foco após remoção do cartão.
- Falha de ação com retry, conflito `409 ALREADY_REVIEWED` sem falso sucesso,
  confirmação nova sem erro herdado, modo pânico ativo e erro de consulta com recuperação.
- Moderador sem ação direta, voto normal e fechamento de caso por quórum simulado.
- Mudança de área com URL e reload.

Os `503` e `409` injetados fazem parte dos cenários de falha e conflito, não de
indisponibilidade omitida. O contraste não cobre todas as paletas da galeria.

Capturas inspecionadas visualmente:

- `success-1280-light.png`: hierarquia, navegação e filtros no desktop.
- `success-390-dark.png`: navegação e controles móveis sem cortes laterais.
- `confirmacao-390-dark.png`: alvo, efeito e ambos os botões inteiros na confirmação.
- `erro-modo-panico-390-light.png`: indisponibilidade explícita, retry e alteração bloqueada.

`report.json` contém o resultado estruturado dos 54 checks. O script e os relatórios
integrais das revisões ficam no diretório local de evidência da tarefa.

## Revisão e pendências

**Requisitos:** a rechecagem estática do delta não encontrou achados remanescentes.
O P3 de erro entre confirmações foi corrigido e comprovado por regressão.

**Padrões:** o P2 de estado incerto do modo pânico foi corrigido e comprovado.
A observação P3 sobre comentários em português não foi aplicada: a instrução expressa
do usuário e o padrão transversal adotado exigem português nos textos produzidos,
prevalecendo sobre a convenção de idioma padrão do repositório. Nenhuma mudança
funcional foi feita para resolver essa divergência de convenção.

**Resumo dos eixos:** Requisitos, zero achados acionáveis no delta; Padrões, zero
achados funcionais remanescentes no delta e uma observação de idioma dispensada
pela instrução aplicável. Revisão corretiva não é aprovação humana de publicação.

**Estado de liberação: não-pronto.** Ainda é necessária publicação de versão ou
pré-versão do DS pelo mantenedor, atualização coordenada da dependência e instalação
limpa pelo lockfile. Não houve deploy nem alteração de produção. Também permanece a
limitação de concorrência preexistente do endpoint, explicitada em `docs/SANCOES.md`
do backend: a prova sequencial não garante exclusão mútua entre decisões simultâneas
ou entre decisão humana e worker. Nenhuma garantia paralela é anunciada aqui.
