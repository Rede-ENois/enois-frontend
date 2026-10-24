#!/usr/bin/env node

import { generate } from "@orval/core";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

await generate({
  config: resolve(root, "orval.config.ts"),
});
