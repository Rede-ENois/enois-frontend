import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

import jsxContentSpacing from "./eslint/rules/jsx-content-spacing.js";
import noFrontMarkup from "./eslint/rules/no-front-markup.js";
import typeBoundaries from "./eslint/rules/type-boundaries.js";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", ".vercel", "src/routeTree.gen.ts"] },
  {
    // `eslint-disable` comments are ignored: a rule that is wrong gets fixed in this file, in a
    // reviewed PR, never silenced at the call site.
    linterOptions: { noInlineConfig: true, reportUnusedInlineConfigs: "off" },
  },
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
          "no-front-markup": noFrontMarkup,
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
          patterns: [
            {
              group: ["@rede-enois/design-system/*/**", "@rede-enois/design-system/dist/**"],
              message:
                "Import the design system only through its entrypoints (`@rede-enois/design-system`, `/ui`, `/patterns`, `/domain`).",
            },
          ],
        },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "Browser storage goes through a store in src/stores/.",
        },
        {
          name: "sessionStorage",
          message: "Browser storage goes through a store in src/stores/.",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message: "Browser storage goes through a store in src/stores/.",
        },
        {
          object: "window",
          property: "sessionStorage",
          message: "Browser storage goes through a store in src/stores/.",
        },
      ],
      // `useToast` mora junto do ToastProvider de propósito (o contexto é privado do arquivo) e é
      // importado de "@/components/ui/toast" em ~55 lugares: separar só para o fast refresh do
      // toast não justifica mexer em tudo isso.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["useToast"] },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "local/jsx-content-spacing": "error",
      "local/type-boundaries": "error",
    },
  },
  {
    // Views are drawn by the design system; the app composes them (see eslint/rules/no-front-markup.js).
    files: ["src/**/*.tsx"],
    ignores: ["src/**/*.test.tsx"],
    rules: {
      "local/no-front-markup": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/(^|[^\\w&])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]",
          message: "No hardcoded colors in the app: use design system tokens.",
        },
        {
          selector:
            "TemplateElement[value.raw=/(^|[^\\w&])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]",
          message: "No hardcoded colors in the app: use design system tokens.",
        },
      ],
    },
  },
  {
    // Stores own browser storage; tests set it up directly.
    files: ["src/stores/**", "src/**/*.test.{ts,tsx}"],
    rules: { "no-restricted-globals": "off", "no-restricted-properties": "off" },
  },
  {
    // Command-line scripts report through the console.
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
  eslintPluginPrettier,
);
