// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationItem } from "./conversation-item";

vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "user_me" } }) }));
vi.mock("@/lib/query-options/profiles", () => ({
  profileQueries: { byId: (id: string) => ({ queryKey: ["profile", id], queryFn: () => null }) },
}));
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

  const render = (lastMessageFrom: string) => {
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <ConversationItem
            conversation={{
              id: "conv_1",
              participantIds: ["user_me", "user_peer"],
              title: null,
              time: null,
              lastMessage: "teste 2",
              unread: 0,
              lastMessageFrom,
            }}
            isActive={false}
            onSelect={() => {}}
          />
        </QueryClientProvider>,
      ),
    );
    return host.textContent;
  };

  it("marks the viewer's own last message", () => {
    expect(render("user_me")).toBe("Você: teste 2");
  });

  it("shows the peer's last message as is", () => {
    expect(render("user_peer")).toBe("teste 2");
  });
});
