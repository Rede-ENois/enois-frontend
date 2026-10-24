import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "./specs/openapi.json",
    },
    output: {
      mode: "single",
      client: "fetch",
      target: "./src/lib/api/generated/orval.ts",
      schemas: {
        path: "./src/types/generated/orval-schemas.ts",
        type: "zod",
        mode: "single",
      },
      clean: true,
    },
  },
});
