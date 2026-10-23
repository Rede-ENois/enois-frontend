import { useState } from "react";

/**
 * Vira `true` na primeira vez que `open` fica verdadeiro e não volta mais.
 *
 * Serve para diálogos que existem em cada card de uma lista: o diálogo só monta (com as queries
 * e o estado dele) quando a pessoa abre pela primeira vez, e continua montado depois, para a
 * animação de fechar e o rascunho do formulário não se perderem.
 */
export function useMountedOnce(open: boolean): boolean {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  return mounted || open;
}
