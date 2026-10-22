/**
 * ID aleatório do aparelho/navegador, criado no primeiro acesso e guardado no localStorage.
 *
 * NÃO é o endereço MAC (o navegador não expõe o MAC e o servidor só veria o MAC do roteador):
 * é um identificador opaco gerado pelo próprio app, usado apenas para correlacionar requisições
 * e uploads da mesma sessão/dispositivo nos logs. Pode ser apagado limpando os dados do site.
 */
const KEY = "connect-grow-device-id";
const VALID = /^[A-Za-z0-9-]{16,64}$/;

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && VALID.test(existing)) return existing;
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "";
  }
}
