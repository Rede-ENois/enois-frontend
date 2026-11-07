// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Origem do backend (SEM path): o proxy encaminha "/api/..." com o path completo.
// Se BACKEND_TARGET tiver um path (ex.: ".../api"), a URL vira "/api/api/...", que o gateway do
// backend não reconhece (404) — foi o que quebrava o dev local.
// O `.env` é a fonte local (o wrapper não o lê sozinho) e `process.env` tem prioridade.
// Written back to the env: SSR loaders read it too (`serverBaseUrl` em `src/lib/api-client.ts`).
const fileEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const BACKEND_TARGET =
  process.env.BACKEND_TARGET ?? fileEnv.BACKEND_TARGET ?? "https://enois.ia.br";
process.env.BACKEND_TARGET = BACKEND_TARGET;
const NITRO_PRESET = process.env.NITRO_PRESET ?? "vercel";

export default defineConfig({
  nitro: {
    preset: NITRO_PRESET,
    // O middleware de dev do Nitro roda ANTES do proxy do Vite: sem este devProxy, "/api/*" cai
    // no SSR do app e responde 404 (HTML) em vez de chegar ao backend.
    devProxy: {
      "/api": { target: BACKEND_TARGET, changeOrigin: true },
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      // O wrapper do Lovable sugere 8080, mas nesta máquina a 8080 é do Coolify/Traefik. A 5173 é
      // a origem liberada no CORS/OAuth do backend em dev; `strictPort` evita cair em 8081 (porta
      // do backend) e só descobrir no 404/CORS minutos depois. No sandbox do Lovable a 8080
      // continua sendo forçada pelo próprio wrapper.
      port: 5173,
      strictPort: true,
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
