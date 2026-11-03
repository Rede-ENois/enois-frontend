import { describe, expect, it } from "vitest";

import { matchFeatures } from "./feature-search";

const none = new Set<string>();

describe("matchFeatures", () => {
  it("finds account pages and Explore rooms ignoring accents and case", () => {
    expect(matchFeatures("CARTEIRA", "SOCIAL", none).map((item) => item.href)).toContain(
      "/carteira",
    );
    expect(matchFeatures("seguranca", "SOCIAL", none).map((item) => item.href)).toContain("/conta");
    expect(matchFeatures("indie", "SOCIAL", none).map((item) => item.href)).toContain("/games");
  });

  it("leaves out rooms whose module the person turned off", () => {
    const hrefs = matchFeatures("jogos", "SOCIAL", new Set(["COMMUNITY_GAMES"])).map(
      (item) => item.href,
    );
    expect(hrefs).not.toContain("/games");
  });

  it("needs two letters and returns places with their icon", () => {
    expect(matchFeatures("c", "SOCIAL", none)).toEqual([]);
    const [first] = matchFeatures("carteira", "SOCIAL", none);
    expect(first).toMatchObject({ type: "feature", image: null });
    expect(first.icon).toBeDefined();
  });
});
