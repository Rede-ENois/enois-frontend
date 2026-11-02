// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationItem } from "./conversation-item";

vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "user_me" } }) }));
vi.mock("@/lib/query-options/profiles", () => ({
  profileQueries: {
    byId: (id: string) => ({
      queryKey: ["profile", id],
      queryFn: () => ({ id, username: id, name: id === "user_ana" ? "Ana Souza" : "Mel Santos" }),
    }),
  },
}));
vi.mock("@/lib/e2e/key-manager", () => ({ hasLocalKeys: () => Promise.resolve(false) }));
vi.mock("@rede-enois/design-system/domain", () => ({
  ConversationItem: ({ conversation }: { conversation: { lastMessage: string } }) => (
    <p>{conversation.lastMessage}</p>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("conversation preview", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    root = createRoot(host);
  });

  afterEach(() => act(() => root.unmount()));

  const render = async (
    lastMessageFrom: string,
    kind: "DIRECT" | "GROUP" = "DIRECT",
    e2e = false,
  ) => {
    const client = new QueryClient();
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <ConversationItem
            conversation={{
              id: "conv_1",
              kind,
              participantIds: ["user_me", "user_peer"],
              title: null,
              time: null,
              lastMessage: "teste 2",
              unread: 0,
              lastMessageFrom,
              lastMessageE2e: e2e,
              lastMessageIv: e2e ? "iv" : null,
            }}
            isActive={false}
            onSelect={() => {}}
          />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return host.textContent;
  };

  it("marks the viewer's own last message", async () => {
    expect(await render("user_me")).toBe("Você: teste 2");
    expect(await render("user_me", "GROUP")).toBe("Você: teste 2");
  });

  it("shows the peer's last message as is in a direct conversation", async () => {
    expect(await render("user_peer")).toBe("teste 2");
  });

  it("names the sender by first name in a group", async () => {
    expect(await render("user_ana", "GROUP")).toBe("Ana: teste 2");
  });

  // Without the local key the preview is a placeholder, not anyone's text: "Você: 🔒" would read as
  // if the viewer had sent a lock, so the placeholder goes without an author.
  it("leaves the author out of an E2E preview this device cannot decrypt", async () => {
    expect(await render("user_me", "DIRECT", true)).toBe("🔒");
    expect(await render("user_bia", "GROUP", true)).toBe("🔒");
  });
});
