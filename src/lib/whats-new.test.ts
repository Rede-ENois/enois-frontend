// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { markWhatsNewSeen, shouldShowWhatsNew } from "./whats-new";

const done = { onboardingCompleted: true };
const v1 = "2026-11-01T10:00:00Z";
const v2 = "2026-11-08T10:00:00Z";

describe("whats-new popup", () => {
  beforeEach(() => localStorage.clear());

  it("opens on the feed once per release, then stays closed", () => {
    expect(shouldShowWhatsNew("/feed", done, v1)).toBe(true);
    markWhatsNewSeen(v1);
    expect(shouldShowWhatsNew("/feed", done, v1)).toBe(false);
  });

  it("opens again when the release is republished", () => {
    markWhatsNewSeen(v1);
    expect(shouldShowWhatsNew("/feed", done, v2)).toBe(true);
  });

  it("stays closed with nothing on air", () => {
    expect(shouldShowWhatsNew("/feed", done, null)).toBe(false);
  });

  it("waits for the onboarding and stays off other pages and signed-out visits", () => {
    expect(shouldShowWhatsNew("/feed", { onboardingCompleted: false }, v1)).toBe(false);
    expect(shouldShowWhatsNew("/boas-vindas", done, v1)).toBe(false);
    expect(shouldShowWhatsNew("/feed", null, v1)).toBe(false);
  });

  it("treats a backend without the onboarding field as done", () => {
    expect(shouldShowWhatsNew("/feed", {}, v1)).toBe(true);
  });
});
