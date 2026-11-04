// `npm run preview`: gera o build com o preset node-server do Nitro e sobe o servidor dele, com o
// mesmo SSR da produção. O `vite preview` não serve aqui: o plugin de preview do TanStack Start
// procura `dist/server/server.js`, e com o Nitro a saída vai para `.output/` (ou `.vercel/output/`
// no preset vercel do build de produção).
//
// Uso: npm run preview [-- --port 4173] [-- --no-build]
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveBin } from "./run-local-bin.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parsePreviewArgs(argv) {
  const portIndex = argv.indexOf("--port");
  const port = portIndex === -1 ? "4173" : argv[portIndex + 1];
  if (!/^\d{2,5}$/.test(port ?? "")) throw new Error(`porta inválida: ${port}`);
  return { port, build: !argv.includes("--no-build") };
}

function run(file, args, env) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function main() {
  const { port, build } = parsePreviewArgs(process.argv.slice(2));
  if (build) {
    const vite = resolveBin(root, "vite");
    if (!vite) {
      console.error("vite não está instalado no node_modules. Rode `npm ci` antes.");
      process.exit(1);
    }
    const status = run(vite, ["build"], { NITRO_PRESET: "node-server" });
    if (status !== 0) process.exit(status);
  }
  const server = join(root, ".output", "server", "index.mjs");
  if (!existsSync(server)) {
    console.error("Build do preview não encontrado em .output/. Rode sem --no-build.");
    process.exit(1);
  }
  process.exit(run(server, [], { PORT: port }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
