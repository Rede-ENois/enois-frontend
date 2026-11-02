import type { ConnectionRequest } from "@/types/application/network/connection-request";
import { describe, expect, it } from "vitest";

import { networkRequests } from "./network-requests";

const request = (patch: Partial<ConnectionRequest> = {}): ConnectionRequest => ({
  id: "c1",
  fromUserId: "u2",
  toUserId: "me",
  status: "PENDING",
  createdAt: "2026-10-28T15:00:00Z",
  direction: "INCOMING",
  peer: {
    id: "u2",
    username: "ana",
    name: "Ana",
    headline: "Dev",
    avatar: null,
    connections: 0,
    followers: 0,
    connected: false,
  },
  ...patch,
});

describe("networkRequests", () => {
  it("draws the other person from the request, with the day it arrived", () => {
    const [row] = networkRequests([request()], {});
    expect(row).toMatchObject({
      userId: "u2",
      name: "Ana",
      profileHref: "/perfil/ana",
      dateLabel: "28 de out.",
      status: "pending",
    });
  });

  it("keeps an answered row in its place after the server drops the request", () => {
    const other = (id: string) =>
      request({ id, peer: { ...request().peer, id, username: id, name: id } });
    const [, row] = networkRequests([other("a"), request(), other("b")], {});
    const accepted = { ...row, status: "accepted" as const };
    const outcomes = { u2: { row: accepted, index: 1 } };
    expect(networkRequests([other("a"), other("b")], outcomes).map((r) => r.userId)).toEqual([
      "a",
      "u2",
      "b",
    ]);
    expect(networkRequests([other("a"), request(), other("b")], outcomes)[1]).toEqual(accepted);
  });

  it("skips a request without the other person instead of breaking the page", () => {
    const old = { ...request(), peer: undefined } as unknown as ConnectionRequest;
    expect(networkRequests([old], {})).toEqual([]);
  });
});
