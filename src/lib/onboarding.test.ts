// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import {
  landingPathFor,
  landingPathForStoredUser,
  markOnboardingShown,
  onboardingErrorMessage,
  shouldRedirectToOnboarding,
} from "./onboarding";

describe("onboarding: para onde vai quem entra", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("quem ainda não fez o onboarding vai para /boas-vindas até a tela ser vista", () => {
    // Choosing the landing does not spend the session: only the screen mounting does.
    expect(landingPathFor({ onboardingCompleted: false })).toBe("/boas-vindas");
    expect(landingPathFor({ onboardingCompleted: false })).toBe("/boas-vindas");
    markOnboardingShown();
    expect(landingPathFor({ onboardingCompleted: false })).toBe("/feed");
  });

  it("quem já fez, ou backend sem o campo, vai direto ao feed", () => {
    expect(landingPathFor({ onboardingCompleted: true })).toBe("/feed");
    expect(landingPathFor({})).toBe("/feed");
    expect(landingPathFor(null)).toBe("/feed");
  });

  it("lê o usuário gravado no login", () => {
    localStorage.setItem("current_user", JSON.stringify({ id: "u", onboardingCompleted: false }));
    expect(landingPathForStoredUser()).toBe("/boas-vindas");
  });

  it("usuário gravado ilegível não prende ninguém fora do feed", () => {
    localStorage.setItem("current_user", "{");
    expect(landingPathForStoredUser()).toBe("/feed");
  });
});

describe("onboarding: guarda central do feed", () => {
  beforeEach(() => sessionStorage.clear());

  it("desvia só no /feed e só enquanto não foi oferecido", () => {
    expect(shouldRedirectToOnboarding("/feed", { onboardingCompleted: false })).toBe(true);
    expect(shouldRedirectToOnboarding("/rede", { onboardingCompleted: false })).toBe(false);
    expect(shouldRedirectToOnboarding("/feed", { onboardingCompleted: true })).toBe(false);
    expect(shouldRedirectToOnboarding("/feed", undefined)).toBe(false);

    markOnboardingShown();
    expect(shouldRedirectToOnboarding("/feed", { onboardingCompleted: false })).toBe(false);
  });
});

describe("onboarding: mensagens de erro", () => {
  it("traduz os códigos do backend e cai no genérico no resto", () => {
    const error = (code: string) => new ApiError(400, code, "raw");
    expect(onboardingErrorMessage(error("CONFLICTING_PREFERENCE"))).toContain("Personalização");
    expect(onboardingErrorMessage(error("TOO_MANY_COMMUNITIES"))).toContain("limite");
    expect(onboardingErrorMessage(error("TOO_MANY_SKILLS"))).toContain("20");
    expect(onboardingErrorMessage(new Error("offline"))).toContain("Tente de novo");
  });
});
