import { describe, expect, it } from "vitest";

import {
  availableFeedPostTypes,
  canCrossPostToProfessional,
  resolveFeedPostType,
} from "./composer-post-type";

describe("composer-post-type", () => {
  it("nunca permite BUSINESS quando a identidade ativa é SOCIAL", () => {
    expect(availableFeedPostTypes("SOCIAL").some((o) => o.id === "BUSINESS")).toBe(false);
    expect(resolveFeedPostType("SOCIAL", "BUSINESS")).toBe("INSIGHT");
    expect(resolveFeedPostType("SOCIAL", "QUESTION")).toBe("QUESTION");
  });

  it("força BUSINESS quando a identidade ativa é CORPORATE", () => {
    expect(availableFeedPostTypes("CORPORATE").map((o) => o.id)).toEqual(["BUSINESS"]);
    expect(resolveFeedPostType("CORPORATE", "INSIGHT")).toBe("BUSINESS");
    expect(resolveFeedPostType("CORPORATE", "BUSINESS")).toBe("BUSINESS");
  });

  it("libera o checkbox de espelhar no feed profissional apenas na conta social com perfil ativo", () => {
    expect(canCrossPostToProfessional("SOCIAL", "ACTIVE", false)).toBe(true);
    expect(canCrossPostToProfessional("SOCIAL", "NOT_READY", false)).toBe(false);
    expect(canCrossPostToProfessional("SOCIAL", "LOADING", false)).toBe(false);
    expect(canCrossPostToProfessional("SOCIAL", "ACTIVE", true)).toBe(false);
    expect(canCrossPostToProfessional("CORPORATE", "ACTIVE", false)).toBe(false);
  });
});
