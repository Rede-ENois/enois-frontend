import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { notificationsApi } from "./notifications";

// Só o `api` é trocado: o `buildQuery` real monta a URL, e é ela que o backend lê.
vi.mock("../api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api-client")>()),
  api: { get: vi.fn() },
}));

// A origem existe só para o `URL` aceitar o caminho relativo entregue ao `api.get`.
function requestedUrl(): URL {
  const path = vi.mocked(api.get).mock.calls[0]?.[0];
  if (path === undefined) {
    throw new Error("notificationsApi.list não chamou api.get");
  }
  return new URL(path, "http://teste");
}

describe("notificationsApi.list", () => {
  afterEach(() => vi.mocked(api.get).mockReset());

  it("sem a opção, pede a lista em ordem de chegada", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], nextCursor: null });

    await notificationsApi.list(null, 10, "SOCIAL");

    const url = requestedUrl();
    expect(url.pathname).toBe("/notifications");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("context")).toBe("SOCIAL");
    expect(url.searchParams.has("unreadFirst")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
  });

  it("com unreadFirst, pede os não lidos primeiro e repassa o cursor de posição", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], nextCursor: null });

    await notificationsApi.list("o:10", 10, "SOCIAL", { unreadFirst: true });

    const url = requestedUrl();
    expect(url.pathname).toBe("/notifications");
    expect(url.searchParams.get("unreadFirst")).toBe("true");
    expect(url.searchParams.get("cursor")).toBe("o:10");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("context")).toBe("SOCIAL");
  });

  it("unreadFirst falso não vai na URL", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], nextCursor: null });

    await notificationsApi.list(null, 10, "SOCIAL", { unreadFirst: false });

    const url = requestedUrl();
    expect(url.searchParams.has("unreadFirst")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("context")).toBe("SOCIAL");
  });
});
