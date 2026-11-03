import { afterEach, describe, expect, it, vi } from "vitest";

import { apiUrl } from "./api-client";

// SSR runs without `window` and without the Vite proxy: a relative `/api` never resolves there.
describe("API base on the server (SSR loaders)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls the dev proxy target instead of a relative path", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("BACKEND_TARGET", "http://localhost:8081");

    expect(apiUrl("/users/pessoa")).toBe("http://localhost:8081/api/users/pessoa");
  });

  it("keeps the relative base when no proxy target is known", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("BACKEND_TARGET", "");

    expect(apiUrl("/users/pessoa")).toBe("/api/users/pessoa");
  });

  it("keeps the browser on the dev proxy", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:5173", href: "/" } });
    vi.stubEnv("BACKEND_TARGET", "http://localhost:8081");

    expect(apiUrl("/users/pessoa")).toBe("/api/users/pessoa");
  });
});
