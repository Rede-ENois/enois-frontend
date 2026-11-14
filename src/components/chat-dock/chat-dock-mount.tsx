import { Suspense, lazy, useEffect, useState } from "react";

import { hasSession } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";

/**
 * Ponto de montagem do dock na casca.
 *
 * O dock inteiro (lista de conversas, thread, banner de chaves) carrega junto a criptografia
 * ponta a ponta: `chat-dock` importa `lib/e2e/key-manager` e `lib/e2e/conversation`, que importam
 * `lib/e2e/crypto` (RSA-OAEP e PBKDF2). Como a casca e o arquivo de entrada do app, esse import
 * estatico punha o modulo de criptografia no chunk inicial, baixado por todo visitante — inclusive
 * quem nunca abre uma conversa e quem nem tem conta.
 *
 * Aqui a casca nao importa o dock: pede o chunk so depois de montar e so para quem tem sessao.
 * Visitante nao baixa nada disso.
 *
 * O desenho so acontece no cliente, depois do efeito: no servidor nao ha sessao para ler e o
 * HTML tem de sair igual ao da primeira renderizacao do cliente, senao a hidratacao diverge.
 */
const ChatDockLazy = lazy(() =>
  import("./chat-dock").then((module) => ({ default: module.ChatDock })),
);

export function ChatDockMount() {
  const authenticated = useIsAuthenticated();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !authenticated || !hasSession()) return null;

  return (
    <Suspense fallback={null}>
      <ChatDockLazy />
    </Suspense>
  );
}
