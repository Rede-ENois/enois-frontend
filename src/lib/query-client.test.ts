import { describe, expect, it } from "vitest";

import { STREAK_QUERY_KEY, createAppQueryClient } from "./query-client";

describe("QueryClient do app", () => {
  it("toda mutação bem-sucedida marca a sequência como velha", async () => {
    const client = createAppQueryClient();
    client.setQueryData(STREAK_QUERY_KEY, { currentDays: 1 });
    client.setQueryData(["feed"], []);

    await client
      .getMutationCache()
      .build(client, { mutationFn: async () => "ok" })
      .execute(undefined);

    expect(client.getQueryState(STREAK_QUERY_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["feed"])?.isInvalidated).toBe(false);
  });

  it("mutação que falha não mexe na sequência", async () => {
    const client = createAppQueryClient();
    client.setQueryData(STREAK_QUERY_KEY, { currentDays: 1 });

    await expect(
      client
        .getMutationCache()
        .build(client, { mutationFn: async () => Promise.reject(new Error("x")), retry: false })
        .execute(undefined),
    ).rejects.toThrow("x");

    expect(client.getQueryState(STREAK_QUERY_KEY)?.isInvalidated).toBe(false);
  });
});
