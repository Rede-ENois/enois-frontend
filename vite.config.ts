// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createLogger } from "vite";

// Origem do backend (SEM path): o proxy abaixo recebe "/api/..." e encaminha o path completo.
// Se BACKEND_TARGET tiver um path (ex.: ".../api"), o proxy concatena e a URL vira "/api/api/...",
// que o gateway do backend não reconhece (404) — foi o que quebrava o dev local.
// Written back to the env: SSR loaders read it too (`serverBaseUrl` in `src/lib/api-client.ts`).
process.env.BACKEND_TARGET ??= "https://enois.ia.br";
const BACKEND_TARGET = process.env.BACKEND_TARGET;
const NITRO_PRESET = process.env.NITRO_PRESET ?? "vercel";

// O @lovable.dev/vite-tanstack-config injeta o plugin vite-tsconfig-paths (até a versão mais
// recente), e o Vite avisa a cada comando que já resolve os paths do tsconfig sozinho. O plugin não
// é nosso para tirar; só esse aviso é filtrado, os demais passam.
const logger = createLogger();
const warn = logger.warn.bind(logger);
const warnOnce = logger.warnOnce.bind(logger);
const fromLovableWrapper = (msg: string) => msg.includes('"vite-tsconfig-paths" is detected');
logger.warn = (msg, options) => {
  if (!fromLovableWrapper(msg)) warn(msg, options);
};
logger.warnOnce = (msg, options) => {
  if (!fromLovableWrapper(msg)) warnOnce(msg, options);
};

export default defineConfig({
  nitro: {
    preset: NITRO_PRESET,
  },
  tanstackStart: {
    server: { entry: "server" },
    // Testes moram ao lado da rota (`eventos.test.tsx`); sem isso o gerador avisa que cada um
    // "não exporta Route" a cada build.
    router: { routeFileIgnorePattern: "\\.test\\.tsx?$" },
  },
  vite: {
    customLogger: logger,
    build: {
      rolldownOptions: {
        // "use client" das libs de React é diretiva de RSC; num bundle SPA/SSR ela não tem efeito e
        // o rolldown avisa uma vez por arquivo. Os outros avisos do bundle continuam aparecendo.
        onLog(level, log, handler) {
          if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
          handler(level, log);
        },
      },
    },
    server: {
      allowedHosts: true,
      proxy: {
        "/api": {
          target: BACKEND_TARGET,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
              // EventSource cannot set headers: declare the dev origin for it (the message stream).
              if (!proxyReq.getHeader("x-client-origin") && req.headers.host) {
                proxyReq.setHeader("x-client-origin", `http://${req.headers.host}`);
              }
            });
          },
        },
      },
    },
  },
});
