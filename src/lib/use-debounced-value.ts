import { useEffect, useState } from "react";

/**
 * Valor que só acompanha a entrada depois de uma pausa.
 *
 * A pesquisa de usuários disparava uma requisição por tecla: cada letra virava uma consulta nova, e
 * numa digitação rápida o servidor recebia várias que já nasciam obsoletas. Com a pausa, a consulta
 * sai uma vez, com o termo que a pessoa realmente quis.
 *
 * O timer é limpo a cada mudança (e no desmonte), então digitar sem parar nunca dispara a consulta
 * intermediária. O primeiro valor vale imediatamente: campo recém-aberto com texto inicial pesquisado
 * não deve esperar a pausa.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
