# Modo BATATA

Modo econômico da interface, para computador antigo com pouca memória e processador fraco. É uma
variante de **apresentação**: nada de funcionalidade sai do app (ver [O que não muda](#o-que-não-muda)).

A referência é a web clássica (Old Reddit, Slackware): conteúdo direto, cores sólidas, bordas de 1px,
canto reto, fonte do sistema. Não é uma cópia de nenhum deles.

## Como liga

Configurações → **Uso saudável**, no mesmo diálogo do Modo lite
([`src/components/healthy-usage/healthy-usage-dialog.tsx`](../src/components/healthy-usage/healthy-usage-dialog.tsx)).
O interruptor **vale no clique**, sem "Salvar":

1. `onBatataModeChange` dispara `toggleBatata` (`src/components/healthy-usage/healthy-usage-dialog.tsx`);
2. `onMutate` grava o espelho no aparelho (`writeBatataMode`) e atualiza o cache de `personalization`
   de forma otimista;
3. `LiteModeEffects` lê a preferência, reage ao evento de mudança do espelho e escreve os atributos
   no `<html>` — a tela muda no mesmo tick, sem recarregar;
4. a gravação vai para `PATCH /preferences/personalization` com `{ batataMode }`;
5. erro do servidor desfaz o espelho e o cache e mostra um aviso; acerto invalida a query.

A preferência mora no backend (`user_preference.batata_mode`), no mesmo registro das demais
preferências. O espelho no `localStorage` (`connect-grow-batata-mode`) existe só para o primeiro
paint e para quando a resposta ainda não chegou.

Fechar o diálogo sem tocar no interruptor não muda nada no BATATA: ele não espera o "Salvar".

## Precedência: BATATA ⊃ Lite

BATATA **é um superconjunto** do Lite. Nenhuma das duas chaves é reescrita quando a outra muda — o
app soma os efeitos na hora de aplicar.

| Estado        | `data-lite` | `data-batata` | O que a tela faz                                          |
| ------------- | ----------- | ------------- | --------------------------------------------------------- |
| Nenhum        | não         | não           | padrão                                                    |
| Lite          | sim         | não           | sem animação/transição, páginas maiores, cache folgado    |
| BATATA        | **sim**     | sim           | tudo do Lite **e** a camada econômica (cor, sombra, raio) |
| Lite + BATATA | sim         | sim           | idêntico ao BATATA                                        |

- `data-lite` continua sendo o que o resto do app consulta para desempenho: páginas 3× maiores
  (`LITE_PAGE_MULTIPLIER`, teto 100), intervalos 4× mais longos, sem autoplay, `staleTime` de 5 min.
  Quem lê é [`src/lib/lite-mode.ts`](../src/lib/lite-mode.ts) via `readEconomicMode()`, e
  [`src/lib/use-lite-mode.ts`](../src/lib/use-lite-mode.ts) passou a devolver `lite || batata`.
- `data-batata` é só do BATATA e comanda a camada de estilo.
- Desligar o BATATA remove `data-batata` e, se o Lite não estiver ligado, também `data-lite`: a tela
  volta exatamente ao que era antes. Nenhum tema ou cor é tocado.

O modo Lite em si não mudou de comportamento: as mesmas chaves, o mesmo evento, os mesmos efeitos.

## O que muda

### Camada de estilo

Está no design system (`src/styles.css`, depois da camada do Lite), atrás de `html[data-batata]`:

- **tokens a zero**: `--radius*` = `0px`, `--shadow-soft`/`--shadow-card` = `none`,
  `--gradient-primary`/`--gradient-soft` = `none`, `--font-sans`/`--font-display` = pilha do sistema;
- **reset de pintura** em `*`: `box-shadow`, `text-shadow`, `backdrop-filter`, `filter` = `none`,
  `border-radius` = 0, `will-change` = `auto`, animação/transição com duração ~0;
- **decoração pura sai do DOM visual**: partículas de moldura e brilho/trilha de órbita
  (`display: none`), e o componente de animação de moldura sequer monta os nós
  (`AvatarFrameFx` devolve `null` quando `data-batata` está no `<html>`);
- **gradiente de texto** virou cor sólida (`--primary`), sem `background-clip: text`;
- **cartão de perfil** sem `transform` 3D e sem o listener de `mousemove` (`data-no-tilt`);
- **foco preservado**: `box-shadow` é o que desenha o `ring-*` do Tailwind, então a camada recoloca
  a indicação com `outline: 2px solid var(--ring)` em `:focus-visible` — sem isso, teclado ficaria
  sem referência visual.

### JavaScript

- **fonte do Google não é baixada**: o bootstrap inline (`src/lib/theme-bootstrap.ts`) só injeta a
  folha de fontes quando não há modo econômico. Quando o **último** modo econômico é desligado — o
  BATATA ou o lite, com a tela aberta —, `ensureWebFonts()` (`src/lib/web-fonts.ts`) traz a fonte de
  volta; desligar um com o outro ligado não a pede. Sem JS, um `<noscript>` no `<head>` mantém a
  fonte.
- **reação de post** (`src/components/post/post-actions.tsx`) não toca animação em modo econômico;
  **autoplay** (`src/lib/feed/video-autoplay.ts`) não observa nem carrega vídeo.
- **cache** mais folgado e **páginas maiores** vêm do efeito do Lite (ver precedência): menos
  requisições e menos trabalho por rolagem.

### Temas

O tema continua funcionando no BATATA: coleção, modo claro/escuro e tema personalizado valem do
mesmo jeito. A camada econômica **não** força paleta — ela remove o _efeito_, não a _cor_.

Escolher outra coleção não liga nem desliga o BATATA. Personalização que dependa de sombra,
gradiente ou desfoque perde esses efeitos no BATATA; o CSS personalizado que declara
`box-shadow`/`filter` também é zerado pela camada (é a contrapartida de "máximo desempenho").

## O que não muda

Feed, posts, comentários, reações, perfis social e profissional, mensagens, notificações,
comunidades, eventos, vagas, formulários, configurações, jogos, navegação por teclado e leitores de
tela. Estados de carregamento, erro e validações continuam iguais — a camada mexe em pintura, não em
fluxo nem em conteúdo.

## Medição

Build de produção (`NITRO_PRESET=node-server`), Chrome headless via CDP, viewport 412×915,
**CPU com throttle 4×** (proxy de processador fraco) e rede a **1,6 Mbps / 150 ms**. Zero backend:
as duas páginas medidas (`/entrar?tab=signup` e `/developers`) não dependem da API, então o número
não é poluído por erro de rede. `HeapProfiler.collectGarbage` antes de cada leitura de memória.
Duas rodadas por cenário; a tabela traz a mediana.

### `/developers` — 2.300 nós de DOM

| Métrica                                      | Padrão   | BATATA   | Δ     |
| -------------------------------------------- | -------- | -------- | ----- |
| Layout até o fim do carregamento             | 2.987 ms | 998 ms   | −67%  |
| Recálculo de estilo isolado (árvore inteira) | 1,49 ms  | 0,51 ms  | −66%  |
| Quadros por segundo durante o scroll         | 15       | 23       | +53%  |
| Quadro no p95 durante o scroll               | 283 ms   | 133 ms   | −53%  |
| Long tasks (`>50 ms`) durante o scroll       | 27       | 12       | −56%  |
| Requisições a `fonts.g*`                     | 2        | 0        | −     |
| Bytes de fonte transferidos                  | 25 KB    | 0        | −     |
| Bytes totais de rede                         | 1.942 KB | 1.917 KB | −1,3% |
| Elementos com `box-shadow`                   | 40       | 0        | −100% |
| Elementos com `backdrop-filter`              | 1        | 0        | −100% |
| Elementos com canto arredondado              | 827      | 0        | −100% |
| Heap após GC                                 | 6,3 MB   | 6,1 MB   | −3%   |

### `/entrar?tab=signup` — página pequena (127 nós)

| Métrica                          | Padrão | BATATA | Δ     |
| -------------------------------- | ------ | ------ | ----- |
| Layout até o fim do carregamento | 999 ms | 52 ms  | −95%  |
| Recálculo de estilo              | 363 ms | 292 ms | −20%  |
| Nós no DOM                       | 127    | 124    | −3    |
| `box-shadow` / canto arredondado | 6 / 12 | 0 / 0  | −     |
| `filter`                         | 2      | 0      | −     |
| Requisições a `fonts.g*`         | 2      | 0      | −     |
| Heap após GC                     | 5,8 MB | 6,0 MB | ruído |

Rodadas individuais das métricas com mais variação (padrão · BATATA): layout em `/developers`
2.987 / 875 · 998 / 688 ms; recálculo de estilo 764 / 595 · 790 / 1.847 ms (a rodada de 1.847 foi
o motivo de refazer a medição isolada da linha "recálculo de estilo isolado", que é estável).

Heap **não** caiu de forma relevante: o mesmo bundle JavaScript carrega nos dois modos. O ganho de
memória viria de outro caminho (ver abaixo).

## O que ainda pode ser otimizado

- **Bundle**: o BATATA não reduz o JavaScript entregue — os mesmos ~1,38 MB (430 kB gzip) de
  entrada. O próximo passo é separar por rota e por modo os módulos de efeito (molduras animadas,
  editor rico, visualizador de mídia) e não baixá-los em modo econômico.
- **Terceiros**: a lista de ícones (`lucide`) e os componentes Radix continuam no bundle mesmo sem
  efeito visível.
- **Listas longas**: o feed ainda renderiza a página inteira (maior no Lite, que é o desejado);
  virtualizar só faz sentido acima de algumas centenas de itens.
- **Imagens**: mídia de post não tem `loading="lazy"` garantido em todos os pontos.
- **CSS personalizado**: o tema do usuário pode reintroduzir efeitos; a camada os neutraliza, mas o
  custo de parse do CSS continua.
