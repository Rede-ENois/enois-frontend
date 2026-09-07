import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import noReexports from "./no-reexports.js";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("no-reexports", noReexports, {
  valid: [
    {
      filename: "/repo/src/components/button.tsx",
      code: "const Button = () => null; export { Button };",
    },
    {
      filename: "/repo/src/types/application/user/user.ts",
      code: "export type User = { id: string };",
    },
    {
      filename: "/repo/src/routeTree.gen.ts",
      code: 'export { Route } from "./routes/index";',
    },
  ],
  invalid: [
    {
      filename: "/repo/src/components/ui.ts",
      code: 'export { Button } from "./button";',
      errors: [{ messageId: "reexport" }],
    },
    {
      filename: "/repo/src/types/application/user/index.ts",
      code: 'export type { User } from "./user";',
      errors: [{ messageId: "reexport" }],
    },
    {
      filename: "/repo/src/lib/api.ts",
      code: 'export * from "./api/client";',
      errors: [{ messageId: "reexport" }],
    },
  ],
});
