// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Origem do backend (SEM path): o proxy abaixo recebe "/api/..." e encaminha o path completo.
// Se BACKEND_TARGET tiver um path (ex.: ".../api"), o proxy concatena e a URL vira "/api/api/...",
// que o gateway do backend não reconhece (404) — foi o que quebrava o dev local.
const BACKEND_TARGET = process.env.BACKEND_TARGET ?? "https://enois.ia.br";
const NITRO_PRESET = process.env.NITRO_PRESET ?? "vercel";

export default defineConfig({
  nitro: {
    preset: NITRO_PRESET,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
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
