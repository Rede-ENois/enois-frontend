import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { POST_TYPES } from "./post-types";

describe("catálogo de tipos de publicação", () => {
  it("traz Reclamação entre os tipos do composer", () => {
    const complaint = POST_TYPES.find((type) => type.id === "COMPLAINT");

    expect(complaint).toBeTruthy();
    expect(complaint?.label).toBe(texts.feed.composer.types.complaint);
    expect(complaint?.label).toBe("Reclamação");
  });

  it("todo tipo do catálogo tem rótulo e ícone", () => {
    for (const type of POST_TYPES) {
      expect(type.label, `rótulo de ${type.id}`).toBeTruthy();
      expect(type.icon, `ícone de ${type.id}`).toBeTruthy();
    }
  });
});
