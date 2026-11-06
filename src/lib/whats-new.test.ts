import { describe, expect, it } from "vitest";

import { CHANGELOG_RELEASES, LATEST_CHANGELOG_VERSION } from "@/constants/changelog";

import { shouldShowWhatsNew } from "./whats-new";

const done = { onboardingCompleted: true };
const v1 = "2026.11.05";
const v2 = "2026.12.01";
const never = { whatsNewEnabled: true, whatsNewLastSeen: null };
const seen = (version: string) => ({ whatsNewEnabled: true, whatsNewLastSeen: version });

describe("whats-new popup", () => {
  it("opens on the feed once per version for an account that never saw it", () => {
    expect(shouldShowWhatsNew("/feed", done, v1, never)).toBe(true);
    expect(shouldShowWhatsNew("/feed", done, v1, seen(v1))).toBe(false);
  });

  it("opens again when a new version is published", () => {
    expect(shouldShowWhatsNew("/feed", done, v2, seen(v1))).toBe(true);
  });

  it("respects the account toggle that disables automatic notices", () => {
    expect(
      shouldShowWhatsNew("/feed", done, v1, { whatsNewEnabled: false, whatsNewLastSeen: null }),
    ).toBe(false);
  });

  it("waits for the account read instead of falling back to the browser", () => {
    expect(shouldShowWhatsNew("/feed", done, v1, undefined)).toBe(false);
    expect(shouldShowWhatsNew("/feed", done, v1, null)).toBe(false);
  });

  it("stays closed with nothing on air", () => {
    expect(shouldShowWhatsNew("/feed", done, null, never)).toBe(false);
  });

  it("waits for the onboarding and stays off other pages and signed-out visits", () => {
    expect(shouldShowWhatsNew("/feed", { onboardingCompleted: false }, v1, never)).toBe(false);
    expect(shouldShowWhatsNew("/boas-vindas", done, v1, never)).toBe(false);
    expect(shouldShowWhatsNew("/feed", null, v1, never)).toBe(false);
  });

  it("treats a backend without the onboarding field as done", () => {
    expect(shouldShowWhatsNew("/feed", {}, v1, never)).toBe(true);
  });
});

describe("changelog releases stability and integrity", () => {
  it("keeps releases sorted with latest first and version matching latest release", () => {
    const versions = CHANGELOG_RELEASES.map((r) => r.version);
    const sorted = [...versions].sort().reverse();
    expect(versions).toEqual(sorted);
    expect(LATEST_CHANGELOG_VERSION).toBe(CHANGELOG_RELEASES[0]?.version);
  });

  it("points all actions to known internal routes", () => {
    const validRoutes = new Set(["/feed", "/grupos", "/conta", "/novidades"]);
    for (const release of CHANGELOG_RELEASES) {
      for (const item of release.items) {
        if (item.action) {
          expect(validRoutes.has(item.action.to)).toBe(true);
        }
      }
    }
  });
});
