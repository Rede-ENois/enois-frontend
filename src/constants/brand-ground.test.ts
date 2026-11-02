import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { BRAND_GROUND } from "./brand-ground";

describe("brand ground", () => {
  it("follows the DS --background token in both modes", () => {
    const css = readFileSync(
      createRequire(import.meta.url).resolve("@rede-enois/design-system/styles.css"),
      "utf8",
    );
    const grounds = [...css.matchAll(/--background:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1]);
    expect(grounds.slice(0, 2)).toEqual([BRAND_GROUND.light, BRAND_GROUND.dark]);
  });
});
