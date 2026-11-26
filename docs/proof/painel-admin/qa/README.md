# Painel administrativo: prova da composição reconciliada

Verificação local em 14/11/2026 (UTC-03:00), para frontend#891, design-system#245 e backend#729. Esta galeria usa o frontend real com **API simulada**, conta e conteúdo inteiramente fictícios. Não é produção nem E2E com backend real.

## Composição exercitada

| Camada        | Base QA                                    |
| ------------- | ------------------------------------------ |
| Backend       | `c95c087019f3d2df949dd82e8f9a389a86ae4c1c` |
| Design system | `93362943d567d9a15bbb28afa766961aac28c81c` |
| Frontend      | `ef1e0d2ff518c0efac3bdaedee3aba1dab0795a0` |

Cada branch foi criada diretamente da QA. Somente o WIP do painel e da ação administrativa foi transportado; não foram incorporados os commits das PRs anteriores de transparência #715, #236 e #883. A área da rede e os contratos existentes da QA foram preservados. Os hashes dos arquivos funcionais exercitados estão em `source-inventory.json`; as capturas e a documentação não alteram o código testado.

## Gates medidos

| Camada             | Resultado                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Backend            | Compilação e 218 testes de moderação em 45 classes aprovados; zero falhas, erros ou skips                         |
| Regressões backend | Quatro casos falham funcionalmente na QA sem a correção e passam na composição final                              |
| Design system      | Lint, tipos, 1958 testes em 205 arquivos, build, test:dist e build-storybook aprovados; zero falhas ou pendências |
| Frontend           | Lint, tipos, 1443 testes em 249 arquivos e build aprovados; zero falhas ou pendências                             |
| Pacote/consumidor  | 2574 arquivos de dist comparados entre tarball e instalação, sem divergência                                      |

O frontend mantém 14 avisos de lint e o DS mantém seis, em arquivos não alterados. Os avisos legados de `act(...)`, configuração esbuild/oxc, tamanho de chunks e diretivas do bundler não foram suprimidos. Não foi executada a suíte geral de todos os módulos Java.

As dependências foram copiadas para worktrees próprios e o tarball foi instalado somente no consumidor isolado, sem salvar caminho local no manifesto ou lockfile. Isso **não comprova instalação limpa pelo lockfile**. O pacote de prova conserva o número-base `0.36.0-rc.1`, mas contém o código ainda não publicado desta entrega, não o conteúdo do pacote publicado desse número.

## Navegador e interação

A rodada integral concluída registrou **54 verificações**, incluindo **28 inspeções renderizadas** em 390px e 1280px, nos modos claro e escuro. `report.json` contém os resultados observados.

- Sem overflow horizontal ou erro inesperado nos cenários inspecionados.
- Contraste mínimo dos textos medidos: **6,25:1**. Não cobre todas as paletas da galeria.
- Busca e filtros combinados, recorte vazio, carregamento, consulta em erro e nova tentativa.
- Confirmação com alvo/efeito, cancelamento sem escrita, operação pendente única e atualização da fila.
- Erro de ação, nova tentativa, conflito sem falso sucesso e erro anterior sem contaminar outra confirmação.
- Moderador sem ação direta, voto normal e encerramento por quórum explicitamente simulado.
- Modo pânico ativo/indisponível visível, alteração bloqueada enquanto o estado não é conhecido e recuperação.
- Seleção de área pela URL e recarregamento.

Os HTTP 503 e 409 dos cenários de falha/conflito foram deliberadamente simulados. Os testes HTTP e os efeitos persistidos no backend foram verificados separadamente.

### Estabilidade do foco: limite não omitido

A primeira rodada desta composição concluiu 52 checks e parou por timeout ao esperar foco no título depois de um voto encerrar a denúncia no celular. Sem mudar a implementação ou enfraquecer a asserção, quatro repetições focadas restauraram o foco, e a segunda rodada integral concluiu os 54 checks. **A causa do timeout não foi estabelecida.** Não se anuncia correção ou estabilidade definitiva a partir da reexecução; esse percurso deve ser revalidado antes da liberação.

## Capturas desta composição

- `success-1280-light.png`: visão geral no desktop, tema claro.
- `success-390-dark.png`: navegação e filtros no celular, tema escuro.
- `confirmacao-390-dark.png`: confirmação administrativa com alvo, efeito e botões completos.
- `erro-modo-panico-390-light.png`: erro de consulta, retry e alteração bloqueada.

Os quatro arquivos foram inspecionados visualmente antes da publicação. A captura inicial do celular não contém toda a fila em uma única dobra: os controles separados ocupam mais espaço vertical, escolha que permanece visível para avaliação da mantenedora.

## Comparação anterior

A pasta [`../comparacao/`](../comparacao/README.md) contém o antes/depois reproduzido anteriormente com a mesma API simulada e dados sintéticos. É evidência comparativa da etapa anterior, não captura desta QA nem imagem histórica salva antes da edição. O README dessa pasta discrimina revisão, dependências e fidelidade.

## Liberação

**Não-pronto para merge/release.** Requer nova versão ou RC com identificador próprio publicada por mantenedor, atualização coordenada de dependência/lockfile, instalação limpa, revisão humana independente e CI remoto. Revalidar também a estabilidade do percurso de foco descrito acima. A limitação preexistente de decisões simultâneas no backend continua documentada; a prova sequencial não garante exclusão mútua em paralelo. Nenhum merge, tag, publicação de pacote ou deploy faz parte desta entrega.
