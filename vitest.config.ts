import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom"],
  },
  // O Vite 8 transforma com o oxc; a chave `esbuild` fazia o Vitest avisar que ela é ignorada.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // Os testes de RuleTester usam o executor próprio: npm run test:eslint-rules.
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // A suíte inteira roda ~190 arquivos em paralelo; numa máquina carregada um teste de
    // milissegundos chegou a ficar 6 s sem CPU e estourar o limite padrão de 5 s.
    testTimeout: 15_000,
  },
});
