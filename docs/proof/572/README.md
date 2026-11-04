# Prova — #572 (look aberto no marketplace esticava os vizinhos)

## O defeito

A grade "Looks prontos" é um `grid`. Por padrão, todo item de uma linha estica até a altura do
mais alto — então abrir as peças de um look fazia os cards vizinhos crescerem junto, com o
conteúdo no topo e um vazio enorme embaixo.

## Como foi medido

`shot-572.mjs` sobe um backend falso em `127.0.0.1:5198` (o SSR do dev chama `BACKEND_TARGET`
direto) e o Chrome headless por CDP. Semeia a sessão, abre `/carteira?tab=loja`, mede a altura e o
topo de cada `.cos-look` e então abre o `<details>` do primeiro look, medindo de novo.

Quatro looks de coleções diferentes, cada um com seis peças reais do catálogo.

## Antes

| Largura | Fechado           | Depois de abrir o primeiro           |
| ------- | ----------------- | ------------------------------------ |
| 1280    | 4 cards de 259 px | **os 4 cards vão a 706 px**          |
| 390     | 4 cards de 255 px | **os 2 da mesma linha vão a 614 px** |

## Depois (`align-items: start` no grid)

| Largura | Fechado            | Depois de abrir o primeiro                               |
| ------- | ------------------ | -------------------------------------------------------- |
| 1280    | 255/255/255/259 px | 706 px no aberto; **vizinhos seguem em 255/255/259 px**  |
| 390     | 4 cards de 255 px  | 614 px no aberto; **o vizinho da linha segue em 255 px** |

Sem rolagem lateral nas duas larguras (`scrollWidth` = `clientWidth`).

## Capturas

- `looks-1280-fechado.png`, `looks-1280-aberto.png`
- `looks-390-fechado.png`, `looks-390-aberto.png`
- `resultado.json` — alturas e topos medidos

## Reproduzir

```bash
# no worktree, com o dev server em 5176 e BACKEND_TARGET=http://localhost:5198
node docs/proof/572/shot-572.mjs
```
