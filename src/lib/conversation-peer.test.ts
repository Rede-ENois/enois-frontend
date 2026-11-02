import type { Profile } from "@/types/application/profile/profile";
import { describe, expect, it } from "vitest";

import { conversationPeer } from "./conversation-peer";

const social = {
  id: "u2",
  username: "aminadojava",
  name: "Nome Social",
  avatar: "social.png",
} as Profile;

describe("conversationPeer", () => {
  it("em conversa profissional mostra a identidade profissional e nunca o @ social", () => {
    const { peer, profileHref } = conversationPeer(
      {
        identities: {
          u2: { identity: "CORPORATE", username: "mel.pro", name: "Mel Santos", avatar: "pro.png" },
        },
      },
      "u2",
      social,
    );

    expect(peer).toEqual({ name: "Mel Santos", avatar: "pro.png" });
    expect(profileHref).toBe("/profissional/mel.pro");
    expect(JSON.stringify(peer)).not.toContain("aminadojava");
  });

  it("sem identidade profissional, usa o perfil da conta", () => {
    const { peer, profileHref } = conversationPeer({ identities: {} }, "u2", social);

    expect(peer?.name).toBe("Nome Social");
    expect(profileHref).toBe("/perfil/aminadojava");
  });

  it("enquanto o perfil não chegou, segura o link pelo id", () => {
    expect(conversationPeer({}, "u2", undefined).profileHref).toBe("/perfil/u2");
  });
});
