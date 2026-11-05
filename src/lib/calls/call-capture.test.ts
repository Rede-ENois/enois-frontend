// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { captureToFile, requestCallCapture } from "./call-capture";

const ORIGIN = "https://chamada.exemplo";

/** Iframe de mentira: só o que a captura usa (src e contentWindow.postMessage). */
function fakeFrame() {
  const postMessage = vi.fn();
  const frame = {
    src: `${ORIGIN}/sala?jwt=abc`,
    contentWindow: { postMessage },
  } as unknown as HTMLIFrameElement;
  return { frame, postMessage, target: frame.contentWindow as unknown as Window };
}

function reply(target: Window, data: unknown, origin = ORIGIN) {
  window.dispatchEvent(
    new MessageEvent("message", { data, origin, source: target as unknown as MessageEventSource }),
  );
}

describe("captura do momento da denúncia", () => {
  afterEach(() => vi.useRealTimers());

  it("pede a foto à sala e devolve a imagem que ela mandou", async () => {
    const { frame, postMessage, target } = fakeFrame();
    const pending = requestCallCapture(frame);

    expect(postMessage).toHaveBeenCalledTimes(1);
    const [request, origin] = postMessage.mock.calls[0];
    expect(origin).toBe(ORIGIN);
    expect(request.type).toBe("enois:call-capture-request");

    reply(target, {
      type: "enois:call-capture-response",
      requestId: request.requestId,
      image: "data:image/jpeg;base64,AAAA",
    });

    await expect(pending).resolves.toBe("data:image/jpeg;base64,AAAA");
  });

  it("ignora resposta de outra origem, de outra janela ou com outro pedido", async () => {
    const { frame, postMessage, target } = fakeFrame();
    const pending = requestCallCapture(frame, 50);
    const requestId = postMessage.mock.calls[0][0].requestId;

    reply(
      target,
      { type: "enois:call-capture-response", requestId, image: "data:image/jpeg;base64,XX" },
      "https://outro.exemplo",
    );
    reply(target, {
      type: "enois:call-capture-response",
      requestId: "outro",
      image: "data:image/jpeg;base64,XX",
    });
    reply(window, {
      type: "enois:call-capture-response",
      requestId,
      image: "data:image/jpeg;base64,XX",
    });

    // Nada disso vale: sem resposta legítima, a denúncia segue sem imagem.
    await expect(pending).resolves.toBeNull();
  });

  it("sala sem imagem legível responde falha e a denúncia segue sem captura", async () => {
    const { frame, postMessage, target } = fakeFrame();
    const pending = requestCallCapture(frame);
    const requestId = postMessage.mock.calls[0][0].requestId;

    reply(target, { type: "enois:call-capture-failed", requestId, reason: "NOTHING_VISIBLE" });

    await expect(pending).resolves.toBeNull();
  });

  it("sem iframe não há pedido nem espera", async () => {
    await expect(requestCallCapture(null)).resolves.toBeNull();
  });

  it("a data URL vira arquivo JPEG para subir pelo storage", () => {
    const file = captureToFile("data:image/jpeg;base64,AAAA");
    expect(file?.type).toBe("image/jpeg");
    expect(file?.name).toBe("captura-da-chamada.jpg");
    expect(captureToFile("sem-virgula")).toBeNull();
  });
});
