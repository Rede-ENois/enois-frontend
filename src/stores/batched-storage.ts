/**
 * Gravacao em lote no localStorage, para o que muda muitas vezes seguidas (o tema).
 *
 * Personalizar o tema mexe em varias chaves e cada passo de um arrasto gravava na hora: 60 passos
 * de slider, 60 gravacoes. Aqui so o valor mais recente de cada chave fica em memoria e todas vao
 * juntas para o disco quando as mudancas param por STORAGE_WRITE_DELAY_MS. Fechar a aba, recarregar,
 * navegar para fora (pagehide) ou trocar de aba/app (visibilitychange para oculto) grava na hora,
 * entao nenhuma escolha se perde.
 */

/**
 * Quanto a gravacao espera depois da ultima mudanca.
 *
 * 250 ms fica acima do intervalo entre dois eventos de um arrasto (~16 ms a 60 Hz) e da repeticao
 * de tecla (~30-90 ms), entao um arrasto continuo vira uma gravacao so. O atraso nao eh o que
 * protege a escolha: fechar ou trocar de aba grava na hora. Ele so limita o que se perde se o
 * navegador morrer sem avisar, no maximo os ultimos 250 ms.
 */
export const STORAGE_WRITE_DELAY_MS = 250;

/** Valor mais recente de cada chave; null eh remover. */
const pending = new Map<string, string | null>();
let timer: ReturnType<typeof setTimeout> | undefined;
let flushListenersInstalled = false;

/** Grava agora tudo o que esta esperando. */
export function flushStorageWrites(): void {
  clearTimeout(timer);
  timer = undefined;
  for (const [key, value] of [...pending]) {
    pending.delete(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
}

/**
 * Fechar a aba ou recarregar dispara pagehide; trocar de aba ou minimizar dispara visibilitychange
 * para "hidden" (no celular eh o ultimo evento garantido antes do sistema matar a pagina). Nos dois,
 * a espera acaba e grava ja.
 */
function installFlushListeners() {
  if (
    flushListenersInstalled ||
    typeof window === "undefined" ||
    typeof window.addEventListener !== "function" ||
    typeof document === "undefined"
  )
    return;
  flushListenersInstalled = true;
  window.addEventListener("pagehide", flushStorageWrites);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushStorageWrites();
  });
}

/**
 * O valor pendente de uma chave, se houver. O getItem do storage precisa consultar aqui antes do
 * disco: entre o set() e o flush, o localStorage ainda tem o valor anterior, e uma leitura nesse
 * intervalo (persist.rehydrate, por exemplo) leria dado velho e sobrescreveria a escolha em memoria.
 *
 * Retorna `{ value }` quando ha escrita pendente (value pode ser null, que eh remocao), ou
 * `undefined` quando nao ha nada na fila pra essa chave.
 */
export function readPending(key: string): { value: string | null } | undefined {
  return pending.has(key) ? { value: pending.get(key)! } : undefined;
}

/** Agenda a gravacao de value em key (null remove a chave). */
export function writeStorageLater(key: string, value: string | null): void {
  pending.set(key, value);
  if (typeof window === "undefined") {
    flushStorageWrites();
    return;
  }
  clearTimeout(timer);
  timer = setTimeout(flushStorageWrites, STORAGE_WRITE_DELAY_MS);
  installFlushListeners();
}
