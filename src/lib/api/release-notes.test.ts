import { describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { releaseNotesApi } from "./release-notes";

vi.mock("../api-client", () => ({ api: { get: vi.fn() } }));

describe("release notes on air", () => {
  it("turns the empty response into null for the cache", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(undefined);
    await expect(releaseNotesApi.current()).resolves.toBeNull();
    expect(api.get).toHaveBeenCalledWith("/novidades/atual");
  });

  it("keeps network failures as errors", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("network"));
    await expect(releaseNotesApi.current()).rejects.toThrow("network");
  });
});
