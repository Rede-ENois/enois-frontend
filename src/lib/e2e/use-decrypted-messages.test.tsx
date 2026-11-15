// @vitest-environment jsdom
import { act } from "react";

import type { Message } from "@/types/application/message/message";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import AFTER mocks are declared
import {
  DECRYPT_TIMEOUT_MS,
  TIMEOUT_PLACEHOLDER,
  clearDecryptedMessageCache,
  useDecryptedMessages,
} from "./use-decrypted-messages";

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

function HookProbe({
  messages,
  userId = "user_me",
}: {
  messages: Message[];
  userId?: string | null;
}) {
  captured = useDecryptedMessages(messages, userId);
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
    clearDecryptedMessageCache();
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

  it("decifra a citação E2E mesmo quando a resposta contém apenas mídia", async () => {
    hasLocalKeys.mockResolvedValue(true);
    decryptReceived.mockResolvedValue("Trecho original fictício");
    const messages = [
      msg({
        text: "",
        mediaIds: ["media-ficticia"],
        replyTo: {
          id: "original",
          from: "user_peer",
          text: "cipher-original",
          e2e: true,
          iv: "iv-original",
          encryptedKeys: { user_me: "chave-cifrada-ficticia" },
        },
      }),
    ];
    act(() => root.render(<HookProbe messages={messages} />));
    await flush();
    expect(captured.messages[0].replyTo?.text).toBe("Trecho original fictício");
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

  it("uma mensagem nova nao decifra o historico de novo", async () => {
    hasLocalKeys.mockResolvedValue(true);
    decryptReceived.mockImplementation((message: Message) =>
      Promise.resolve(`claro:${message.id}`),
    );

    const first = [
      msg({ id: "m1", text: "cipher-1", e2e: true, iv: "iv1" }),
      msg({ id: "m2", text: "cipher-2", e2e: true, iv: "iv2" }),
    ];
    act(() => root.render(<HookProbe messages={first} />));
    await flush();
    expect(decryptReceived).toHaveBeenCalledTimes(2);

    // Chega uma terceira: so ela passa pelo RSA; as duas primeiras vem do cache.
    const second = [...first, msg({ id: "m3", text: "cipher-3", e2e: true, iv: "iv3" })];
    act(() => root.render(<HookProbe messages={second} />));
    await flush();

    expect(decryptReceived).toHaveBeenCalledTimes(3);
    expect(decryptReceived.mock.calls.map((call) => (call[0] as Message).id)).toEqual([
      "m1",
      "m2",
      "m3",
    ]);
    expect(captured.messages.map((message) => message.text)).toEqual([
      "claro:m1",
      "claro:m2",
      "claro:m3",
    ]);
  });

  it("id repetido com outro ciphertext e decifrado de novo", async () => {
    hasLocalKeys.mockResolvedValue(true);
    decryptReceived.mockImplementation((message: Message) =>
      Promise.resolve(`claro:${message.text}`),
    );

    act(() =>
      root.render(<HookProbe messages={[msg({ id: "m1", text: "a", e2e: true, iv: "iv" })]} />),
    );
    await flush();
    act(() =>
      root.render(<HookProbe messages={[msg({ id: "m1", text: "b", e2e: true, iv: "iv" })]} />),
    );
    await flush();

    expect(decryptReceived).toHaveBeenCalledTimes(2);
    expect(captured.messages[0].text).toBe("claro:b");
  });

  it("reutiliza o cache da citação ao paginar e ao carregar a original", async () => {
    vi.useFakeTimers();
    try {
      hasLocalKeys.mockResolvedValue(true);
      decryptReceived.mockResolvedValue("Trecho original fictício");
      const original = msg({ id: "original", text: "cipher", e2e: true, iv: "iv" });
      const reply = msg({
        replyTo: { id: original.id, from: original.from, text: original.text, e2e: true, iv: "iv" },
      });
      act(() => root.render(<HookProbe messages={[reply]} />));
      await act(() => vi.advanceTimersByTimeAsync(800));
      expect(captured.messages[0].replyTo?.text).toBe("Trecho original fictício");
      act(() => root.render(<HookProbe messages={[reply, msg({ id: "outra" })]} />));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(captured.messages[0].replyTo?.text).toBe("Trecho original fictício");
      act(() => root.render(<HookProbe messages={[original, reply]} />));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(captured.messages[0].text).toBe("Trecho original fictício");
      expect(captured.messages[1].replyTo?.text).toBe("Trecho original fictício");
      expect(decryptReceived).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("aplica o teto da QA também à decifragem da original citada", async () => {
    vi.useFakeTimers();
    try {
      hasLocalKeys.mockResolvedValue(true);
      decryptReceived.mockImplementation(() => new Promise<string>(() => undefined));
      act(() =>
        root.render(
          <HookProbe
            messages={[
              msg({
                replyTo: { id: "original", from: "peer", text: "cipher", e2e: true, iv: "iv" },
              }),
            ]}
          />,
        ),
      );
      await act(() => vi.advanceTimersByTimeAsync(DECRYPT_TIMEOUT_MS));
      expect(captured.decrypting).toBe(false);
      expect(captured.messages[0].replyTo?.text).toBe(TIMEOUT_PLACEHOLDER);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("não reaproveita decifragem atrasada de outra conta no cache da citação", async () => {
    vi.useFakeTimers();
    try {
      hasLocalKeys.mockResolvedValue(true);
      let release: (text: string) => void = () => {};
      decryptReceived.mockImplementationOnce(
        () => new Promise<string>((resolve) => (release = resolve)),
      );
      decryptReceived.mockResolvedValue("Texto da conta atual");
      const messages = [
        msg({
          replyTo: {
            id: "original",
            from: "user_peer",
            text: "cipher-original",
            e2e: true,
            iv: "iv-original",
          },
        }),
      ];
      act(() => root.render(<HookProbe messages={messages} />));
      await act(() => vi.advanceTimersByTimeAsync(0));
      act(() => root.render(<HookProbe messages={messages} userId="outra-conta" />));
      await act(() => vi.advanceTimersByTimeAsync(800));
      expect(captured.messages[0].replyTo?.text).toBe("Texto da conta atual");
      await act(async () => release("Texto da conta anterior"));
      act(() => root.render(<HookProbe messages={[...messages]} userId="outra-conta" />));
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(captured.messages[0].replyTo?.text).toBe("Texto da conta atual");
    } finally {
      vi.useRealTimers();
    }
  });

  it("decifragem presa nao segura a thread: estoura o teto e vira placeholder", async () => {
    vi.useFakeTimers();
    try {
      hasLocalKeys.mockResolvedValue(true);
      decryptReceived.mockImplementation((message: Message) =>
        message.id === "presa"
          ? new Promise<string>(() => undefined) // nunca resolve
          : Promise.resolve(`claro:${message.id}`),
      );

      const presa = msg({ id: "presa", text: "cipher", e2e: true, iv: "iv" });
      const ok = msg({ id: "ok", text: "cipher", e2e: true, iv: "iv" });
      act(() => root.render(<HookProbe messages={[presa, ok]} />));
      // O relogio falso solta as microtarefas pendentes sem avancar o MIN_DECRYPT (que vence
      // antes do teto); avancar ATE o teto dispara o placeholder e o fim do loading.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(DECRYPT_TIMEOUT_MS);
      });

      expect(captured.decrypting).toBe(false);
      expect(captured.messages.find((m) => m.id === "presa")?.text).toBe(TIMEOUT_PLACEHOLDER);
      expect(captured.messages.find((m) => m.id === "ok")?.text).toBe("claro:ok");
    } finally {
      vi.useRealTimers();
    }
  });
});
