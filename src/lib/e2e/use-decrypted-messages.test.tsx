// @vitest-environment jsdom
import { act } from "react";

import type { Message } from "@/types/application/message/message";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import AFTER mocks are declared
import { useDecryptedMessages } from "./use-decrypted-messages";

const decryptReceived = vi.fn();
const hasLocalKeys = vi.fn();

vi.mock("./conversation", () => ({
  decryptReceived: (...args: unknown[]) => decryptReceived(...args),
}));

vi.mock("./key-manager", () => ({
  hasLocalKeys: () => hasLocalKeys(),
}));

function msg(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg_1",
    conversationId: "conv_1",
    from: "user_1",
    text: "texto",
    mediaIds: [],
    time: "2026-10-30T00:00:00Z",
    e2e: false,
    iv: null,
    ...overrides,
  };
}

let captured: { messages: Message[]; decrypting: boolean } = { messages: [], decrypting: true };

function HookProbe({ messages }: { messages: Message[] }) {
  captured = useDecryptedMessages(messages);
  return null;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 200));
  });

describe("useDecryptedMessages", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    decryptReceived.mockReset();
    hasLocalKeys.mockReset();
    captured = { messages: [], decrypting: true };
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("passes through non-e2e messages without decrypting", async () => {
    const messages = [msg({ id: "m1", text: "ola" }), msg({ id: "m2", text: "tudo bem?" })];

    act(() => root.render(<HookProbe messages={messages} />));
    await flush();

    expect(captured.messages).toHaveLength(2);
    expect(captured.messages[0].text).toBe("ola");
    expect(captured.messages[1].text).toBe("tudo bem?");
    expect(captured.decrypting).toBe(false);
    expect(decryptReceived).not.toHaveBeenCalled();
  });

  it("shows lock emoji when no local keys", async () => {
    hasLocalKeys.mockResolvedValue(false);

    const messages = [msg({ id: "m1", text: "cipher", e2e: true, iv: "iv" })];

    act(() => root.render(<HookProbe messages={messages} />));
    await flush();

    expect(captured.messages[0].text).toBe("🔒 Mensagem cifrada");
    expect(captured.decrypting).toBe(false);
  });

  it("decrypts e2e messages when keys exist", async () => {
    hasLocalKeys.mockResolvedValue(true);
    decryptReceived.mockResolvedValue("decifrada");

    const messages = [
      msg({ id: "m1", text: "normal" }),
      msg({ id: "m2", text: "cipher", e2e: true, iv: "iv" }),
    ];

    act(() => root.render(<HookProbe messages={messages} />));
    await flush();

    expect(captured.messages).toHaveLength(2);
    expect(captured.messages[0].text).toBe("normal");
    expect(captured.messages[1].text).toBe("decifrada");
    expect(decryptReceived).toHaveBeenCalledOnce();
  });
});
