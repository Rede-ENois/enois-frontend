# Prova visual — #562 (página "Conta e segurança" e menu da conta)

O gate do contrato pede ~390 px e ~1280 px para tela alterada. Esta PR muda duas superfícies: a
página nova `/conta` e o menu da conta, que passou a ter uma entrada só para tudo que antes eram
vários itens.

## Como foi medido

`shot-562.mjs` sobe um backend falso em `127.0.0.1:5198` (o SSR do dev chama `BACKEND_TARGET`
direto, sem proxy) e o Chrome headless em CDP. Para cada largura:

1. Semeia a sessão (`enois_auth`, `session_active`, `current_user`) em `/entrar`.
2. Abre `/conta`, espera o `h1` e lê título, seções, rótulos e `scrollWidth` × `clientWidth`.
3. Abre `/feed`, clica no gatilho `aria-label="Menu da conta"` e lê os itens do popover.

O menu do design system é um `Popover` do Radix, não um `role="menu"`: a espera é pelo
`[data-slot="popover-content"]`, e o clique dispara `pointerdown/mousedown/pointerup/mouseup/click`
porque o Radix abre no `pointerdown`.

## Resultado

| Largura | `/conta`                                                                             | Menu                                              | Overflow lateral   |
| ------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------ |
| 1280    | título "Conta e segurança", seções Acesso / Privacidade e moderação / Encerrar conta | 11 itens, com **uma** entrada "Conta e segurança" | nenhum (1280/1280) |
| 390     | idem                                                                                 | idem                                              | nenhum (390/390)   |

Itens do menu nas duas larguras: Ver perfil, Perfil profissional, Carteira, Marketplace, **Conta e
segurança**, Ajuda e suporte, Uso saudável, Supervisão parental, Painel de moderador, Apoie o Énóis,
Sair. Não há mais entradas separadas de "Alterar e-mail", "Trocar senha", "Contas vinculadas",
"Segurança e verificação", "Usuários bloqueados", "Minhas denúncias", "Penalidades" nem "Excluir
conta" — todas vivem na página.

## Capturas

- `conta-1280.png`, `conta-390.png`
- `menu-1280.png`, `menu-390.png`
- `resultado.json` — leitura bruta das duas larguras

## Reproduzir

```bash
# no worktree, com o dev server em 5176 e BACKEND_TARGET=http://localhost:5198
node docs/proof/562/shot-562.mjs
```
