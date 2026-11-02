import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishOAuthLogin } from "./oauth-callback";

const deps = vi.hoisted(() => ({ me: vi.fn(), renewSession: vi.fn(), storeSession: vi.fn() }));

vi.mock("./api/auth", () => ({ authApi: { me: deps.me } }));
vi.mock("./api-client", () => ({
  apiUrl: (path: string) => path,
  renewSession: deps.renewSession,
}));
vi.mock("./session", () => ({ storeSession: deps.storeSession }));

describe("finishOAuthLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.me.mockResolvedValue({ id: "user_1" });
  });

  it("enters the app when the session holds and its expiry was recorded", async () => {
    deps.renewSession.mockResolvedValue("renewed");
    await expect(finishOAuthLogin()).resolves.toEqual({ id: "user_1" });
    expect(deps.storeSession).toHaveBeenCalledWith({ user: { id: "user_1" } });
  });

  it("does not enter the app when the refresh is refused", async () => {
    deps.renewSession.mockResolvedValue("refused");
    await expect(finishOAuthLogin()).resolves.toBeNull();
  });

  it("still enters when the refresh is only unavailable (session confirmed by /auth/me)", async () => {
    deps.renewSession.mockResolvedValue("unavailable");
    await expect(finishOAuthLogin()).resolves.toEqual({ id: "user_1" });
  });

  it("does not enter when /auth/me fails", async () => {
    deps.me.mockRejectedValue(new Error("401"));
    await expect(finishOAuthLogin()).resolves.toBeNull();
    expect(deps.renewSession).not.toHaveBeenCalled();
  });
});
