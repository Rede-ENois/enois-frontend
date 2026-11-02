/** Mesmo formato que o backend aceita: 3 a 30 caracteres, começando e terminando em letra/número. */
const NAMETAG = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/;

/** Normaliza o que a pessoa digitou para o formato guardado (minúsculas, sem espaços nas pontas). */
export function normalizeNametag(value: string): string {
  return value.trim().toLowerCase();
}

/** O nametag é o `@` e o fim da URL pública: o formato é o mesmo dos dois lados. */
export function isValidNametag(value: string): boolean {
  return NAMETAG.test(normalizeNametag(value));
}

/** Caminho público do perfil profissional para um nametag. */
export function nametagPath(nametag: string): string {
  return `/profissional/${normalizeNametag(nametag)}`;
}
