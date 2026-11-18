// @vitest-environment jsdom
import { act } from "react";

import type { Message } from "@/types/application/message/message";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { MessageBubble } from "./message-bubble";

vi.mock("@/components/post/media-grid", () => ({ MediaGrid: () => null }));
vi.mock("@/components/post/rich-text", () => ({ RichText: () => null }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const message: Message = {
  id: "resposta-ficticia",
  conversationId: "conversa-ficticia",
  from: "peer",
  text: "Resposta fictícia",
  mediaIds: [],
  time: "2026-11-01T12:00:00Z",
  replyTo: { id: "original-ficticia", from: "peer", text: "Trecho original decifrado", e2e: true },
};

describe("citação de mensagem privada", () => {
  it("mostra o trecho decifrado mesmo quando a original é E2E", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <MessageBubble
            message={message}
            currentUserId="viewer"
            isMe={false}
            peer={{ name: "Pessoa fictícia" }}
            profileHref="/perfil-ficticio"
          />,
        ),
      );
      expect(host.textContent).toContain("Trecho original decifrado");
      expect(host.textContent).not.toContain("[Mensagem cifrada]");
      expect(host.textContent).toContain("Pessoa fictícia");
    } finally {
      act(() => root.unmount());
    }
  });
});
