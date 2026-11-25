// Calcula a integridade SRI de um tarball já baixado, para testar se um lock a preserva.
// O tarball publicado do design system não é alcançável de todas as máquinas (o npm local dá 401
// sem `read:packages`), então a conferência roda onde o token do CI enxerga o pacote.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: node integridade-pacote.mjs <tarball>");
  process.exit(2);
}

const sri = `sha512-${createHash("sha512").update(readFileSync(resolve(arquivo))).digest("base64")}`;
console.log(sri);
