import { describe, expect, it } from "vitest";

import { sealEmblemSrc } from "./seal-emblem";

describe("sealEmblemSrc", () => {
  it("points the emblem name at the fixed asset folder", () => {
    expect(sealEmblemSrc("contribuinte-serio")).toBe("/seals/contribuinte-serio.png");
  });

  it("ignores a missing or unsafe name", () => {
    expect(sealEmblemSrc(undefined)).toBeUndefined();
    expect(sealEmblemSrc("")).toBeUndefined();
    expect(sealEmblemSrc("../x")).toBeUndefined();
  });
});
