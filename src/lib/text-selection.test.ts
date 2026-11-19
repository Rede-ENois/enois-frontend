import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("seleção de texto no styles.css", () => {
  it("define ::selection com contraste explícito usando os tokens do tema", () => {
    const css = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
    const block = css.match(/::selection\s*\{([^}]*)\}/);

    expect(block).not.toBeNull();
    expect(block![1]).toContain("background-color: var(--color-primary");
    expect(block![1]).toContain("color: var(--color-primary-foreground");
  });
});
