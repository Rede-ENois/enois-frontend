import type { PostCommunity } from "@/types/application/community/post-community";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { describe, expect, it } from "vitest";

import { backTargetOf } from "./post-back-target";

const community: PostCommunity = { id: "com_1", name: "Nois Tudo", joined: true };

describe("backTargetOf — destino do voltar do post único", () => {
  it("post de comunidade volta para a comunidade de origem", () => {
    expect(backTargetOf({ community })).toEqual({
      to: "/comunidades/$communityId",
      communityId: "com_1",
    });
  });

  it("post sem comunidade volta para o feed", () => {
    expect(backTargetOf({ community: null })).toEqual({ to: "/feed" });
    expect(backTargetOf(undefined)).toEqual({ to: "/feed" });
  });

  it("post sem comunidade preserva a aba do feed de origem", () => {
    const aba: HomeTab = "FOLLOWING";
    expect(backTargetOf(undefined, aba)).toEqual({ to: "/feed", feedTab: "FOLLOWING" });
  });
});
