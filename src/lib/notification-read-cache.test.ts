import { QueryClient } from "@tanstack/react-query";

import type { Notification } from "@/types/application/notification/notification";
import { describe, expect, it } from "vitest";

import { markReadInCache } from "./notification-read-cache";

const notification = (id: string): Notification =>
  ({ id, kind: "NEW_REACTION", read: false }) as Notification;

describe("markReadInCache", () => {
  it("dims the opened notification in the bell list and in the full page at once", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a"), notification("b")],
      nextCursor: null,
    });
    client.setQueryData(["notifications", "page", "SOCIAL"], {
      pages: [{ items: [notification("a")], nextCursor: null }],
      pageParams: [null],
    });
    client.setQueryData(["notifications", "summary", "SOCIAL"], { total: 2, byModule: {} });

    markReadInCache(client, "a");

    const bell = client.getQueryData<{ items: Notification[] }>(["notifications", "SOCIAL"]);
    const page = client.getQueryData<{ pages: { items: Notification[] }[] }>([
      "notifications",
      "page",
      "SOCIAL",
    ]);
    expect(bell?.items.map((item) => item.read)).toEqual([true, false]);
    expect(page?.pages[0].items[0].read).toBe(true);
    expect(client.getQueryData(["notifications", "summary", "SOCIAL"])).toEqual({
      total: 2,
      byModule: {},
    });
  });

  it("marks everything for read-all", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a"), notification("b")],
      nextCursor: null,
    });

    markReadInCache(client, "all");

    const bell = client.getQueryData<{ items: Notification[] }>(["notifications", "SOCIAL"]);
    expect(bell?.items.every((item) => item.read)).toBe(true);
  });
});
