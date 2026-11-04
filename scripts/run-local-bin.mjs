// Executa o binário de um pacote instalado no node_modules do projeto (usado pelos hooks do
// pre-commit). Resolve o arquivo do binário pelo package.json do pacote, então funciona igual em
// qualquer cliente git e sistema, sem depender do PATH nem de node_modules/.bin. Sem as
// dependências instaladas, falha com uma mensagem só, em vez de um erro do npx por arquivo.
//
// Uso: node scripts/run-local-bin.mjs <pacote> [binário] -- [argumentos...]
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function resolveBin(projectRoot, pkg, bin = pkg) {
  const manifestPath = join(projectRoot, "node_modules", pkg, "package.json");
  if (!existsSync(manifestPath)) return null;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const relative = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[bin];
  if (!relative) return null;
  const file = join(projectRoot, "node_modules", pkg, relative);
  return existsSync(file) ? file : null;
}

export function parseArgs(argv) {
  const separator = argv.indexOf("--");
  const head = separator === -1 ? argv : argv.slice(0, separator);
  const rest = separator === -1 ? [] : argv.slice(separator + 1);
  const [pkg, bin] = head;
  if (!pkg) throw new Error("uso: node scripts/run-local-bin.mjs <pacote> [binário] -- [args]");
  return { pkg, bin: bin ?? pkg, args: rest };
}

/** Executa o binário do pacote com o Node atual e devolve o código de saída (null se não existe). */
export function runBin(projectRoot, pkg, bin, args) {
  const file = resolveBin(projectRoot, pkg, bin);
  if (!file) return null;
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function main() {
  const { pkg, bin, args } = parseArgs(process.argv.slice(2));
  const status = runBin(root, pkg, bin, args);
  if (status === null) {
    console.error(
      `"${bin}" (pacote ${pkg}) não está instalado no node_modules. Rode \`npm ci\` antes de ` +
        "commitar; o README explica o token do GitHub Packages que a instalação exige.",
    );
    process.exit(1);
  }
  process.exit(status);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
