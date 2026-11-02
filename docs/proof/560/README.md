# #560 — o menu da conta diz em qual perfil a pessoa está

Alternar entre perfil Social e Profissional pelo ícone da conta troca o menu inteiro: opções que
existem nas duas visões (Carteira, Marketplace, Alterar e-mail) continuam, e as que pertencem só ao
perfil profissional (Vagas, Freelances, Empresas, Mentoria, Serviços) aparecem ou somem de uma vez.
Para quem acabou de conhecer a alternância, essa troca inteira parece bug.

Agora, quando a conta tem perfil profissional ativo (é quando existe o que alternar), o menu mostra
uma linha acima da escolha: **"Você está no perfil Social"** ou **"Você está no perfil
Profissional"**, acompanhando a escolha atual.

Medido no app real (Vite em 5174), com a sessão simulada no `localStorage` e a API interceptada no
Chrome headless — nenhuma conta real, nenhum cookie de sessão de verdade:

| Largura | Aviso no menu                              | Largura do documento |
| ------- | ------------------------------------------ | -------------------- |
| 390     | "Você está no perfil Social", 238×16 px    | 390 — sem rolagem lateral |
| 1280    | "Você está no perfil Social", 238×16 px    | 1280 — sem rolagem lateral |

- `menu-390.png` — menu aberto no telefone: o aviso fica entre o cabeçalho da conta e a escolha.
- `menu-1280.png` — o mesmo no desktop.

Sem perfil profissional ativo a linha não aparece: não há alternância, e um "você está no perfil
Social" sugeriria uma escolha que a pessoa não tem.

Como reproduzir: `node shot-560.mjs`, com o app em `http://127.0.0.1:5174`. O script abre o Chrome
headless, semeia `session_active` e `enois_auth` (a pista de sessão), intercepta `/api/me`,
`/api/me/business-profile` e as rotas de apoio, clica no botão "Menu da conta" e captura a 390 e a
1280.
