// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * O módulo guarda "já autorizado" em memória, para não acender a câmera de novo a cada
 * reconexão. Cada teste reimporta o módulo para começar do zero.
 */
async function freshModule() {
  vi.resetModules();
  return import("./call-media-permission");
}

function track() {
  return { stop: vi.fn() };
}

function stubMedia(getUserMedia: (constraints: MediaStreamConstraints) => Promise<unknown>) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(getUserMedia) },
  });
}

describe("permissão de microfone e câmera antes da sala", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "mediaDevices");
  });

  it("pede áudio e vídeo na chamada de vídeo, e solta as faixas depois", async () => {
    const media = track();
    stubMedia(async () => ({ getTracks: () => [media] }));
    const { requestCallMedia } = await freshModule();

    expect(await requestCallMedia("VIDEO")).toBe("granted");
    const constraints = (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(constraints.audio).toBeTruthy();
    expect(constraints.video).toBeTruthy();
    // Segurar a câmera aqui impediria o Epapo de abri-la.
    expect(media.stop).toHaveBeenCalledTimes(1);
  });

  it("a chamada de voz não acende a câmera", async () => {
    stubMedia(async () => ({ getTracks: () => [] }));
    const { requestCallMedia } = await freshModule();

    expect(await requestCallMedia("AUDIO")).toBe("granted");
    const constraints = (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(constraints.audio).toBeTruthy();
    expect(constraints.video).toBe(false);
  });

  it("recusa do navegador vira aviso, não uma sala muda sem explicação", async () => {
    stubMedia(async () => {
      throw new DOMException("no", "NotAllowedError");
    });
    const { requestCallMedia } = await freshModule();
    expect(await requestCallMedia("VIDEO")).toBe("denied");
  });

  it("aparelho sem câmera ou ocupado por outro app tem o seu próprio aviso", async () => {
    stubMedia(async () => {
      throw new DOMException("busy", "NotReadableError");
    });
    const { requestCallMedia } = await freshModule();
    expect(await requestCallMedia("VIDEO")).toBe("unavailable");
  });

  it("navegador sem acesso à mídia não quebra a chamada", async () => {
    const { requestCallMedia } = await freshModule();
    expect(await requestCallMedia("VIDEO")).toBe("unsupported");
  });

  it("depois de autorizado não pede de novo (reconectar não acende a câmera outra vez)", async () => {
    stubMedia(async () => ({ getTracks: () => [] }));
    const { requestCallMedia } = await freshModule();
    await requestCallMedia("VIDEO");
    await requestCallMedia("VIDEO");
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });
});
