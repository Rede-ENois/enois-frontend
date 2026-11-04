import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

import jsxContentSpacing from "./eslint/rules/jsx-content-spacing.js";
import typeBoundaries from "./eslint/rules/type-boundaries.js";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", ".vercel"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      local: {
        rules: {
          "jsx-content-spacing": jsxContentSpacing,
          "type-boundaries": typeBoundaries,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      // `useToast` mora junto do ToastProvider de propósito (o contexto é privado do arquivo) e é
      // importado de "@/components/ui/toast" em ~55 lugares: separar só para o fast refresh do
      // toast não justifica mexer em tudo isso. `useCalls` e `useOpenCall` seguem o mesmo desenho:
      // leem o contexto privado do CallsProvider.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["useToast", "useCalls", "useOpenCall"] },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "local/jsx-content-spacing": "error",
      "local/type-boundaries": "error",
    },
  },
  eslintPluginPrettier,
);
