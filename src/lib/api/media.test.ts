import { texts } from "@/texts";
import { describe, expect, it, vi } from "vitest";

import { mediaApi, mediaUploadResponseError, resolveCdnUrl, withImageKitOriginal } from "./media";

describe("mediaUploadResponseError", () => {
  it("preserves the API code and maps the moderation message", () => {
    const error = mediaUploadResponseError(
      422,
      JSON.stringify({ code: "IMAGE_CONTENT_NOT_ALLOWED", message: "raw" }),
      "/storage/uploads/media_example/file.jpg",
    );

    expect(error).toMatchObject({
      status: 422,
      code: "IMAGE_CONTENT_NOT_ALLOWED",
      path: "/storage/uploads/media_example/file.jpg",
      message: texts.errors.knownCodes.IMAGE_CONTENT_NOT_ALLOWED,
    });
  });

  it("uses the backend message for an unrecognized code", () => {
    const error = mediaUploadResponseError(
      422,
      JSON.stringify({ code: "NEW_MEDIA_ERROR", message: "Tente novamente." }),
      "/storage/key",
    );

    expect(error.message).toBe("Tente novamente.");
    expect(error.code).toBe("NEW_MEDIA_ERROR");
  });

  it("keeps an HTTP fallback when the proxy body is not JSON", () => {
    const error = mediaUploadResponseError(503, "temporarily unavailable", "/storage/key");

    expect(error).toMatchObject({
      status: 503,
      path: "/storage/key",
      message: "Upload falhou: 503",
    });
  });
});

describe("withImageKitOriginal", () => {
  /**
   * A mídia saindo do Énóis Storage (brief §13) tem de chegar ao player SEM transformação: a rota
   * nova responde `Range`/`206` nativamente. Se este adapter passasse a reescrever a URL do nosso
   * Storage, o seek do vídeo quebraria — e o sintoma seria "vídeo que reinicia", invisível em teste
   * de upload.
   */
  it("deixa a URL do nosso Storage intacta", () => {
    const url = "https://api.enois.ia.br/api/network/storage/objects/sob_abc/content";

    expect(withImageKitOriginal(url)).toBe(url);
  });

  it("mantém o caminho de figurinha do próprio backend intacto", () => {
    const url = "/emotes/image/abc";

    expect(withImageKitOriginal(url)).toContain("/emotes/image/abc");
  });

  it("ainda troca a entrega do ImageKit pelo original", () => {
    const resolved = withImageKitOriginal("https://ik.imagekit.io/conta/clipe.mp4");

    expect(resolved).toContain("tr=orig-true");
  });

  it("não inventa parâmetro em URL que não é do CDN", () => {
    const url = "https://exemplo.com/video.mp4";

    expect(withImageKitOriginal(url)).toBe(url);
  });

  it("resolveCdnUrl não duplica a barra em caminho relativo", () => {
    expect(resolveCdnUrl("/a/b.png")).not.toContain("//a/b");
  });
});

describe("uploadToSignedUrl", () => {
  /** Dublê mínimo de XHR: captura o PUT e deixa o teste dirigir progresso, resposta e aborto. */
  function fakeXhr() {
    const request = {
      status: 0,
      responseText: "",
      withCredentials: false,
      requestHeaders: {} as Record<string, string>,
      body: null as unknown,
      onload: null as (() => void) | null,
      onabort: null as (() => void) | null,
      opened: false,
      upload: {
        onprogress: null as
          ((ev: { loaded: number; total: number; lengthComputable: boolean }) => void) | null,
      },
      open: (_m: string, _u: string) => {
        request.opened = true;
      },
      setRequestHeader: (n: string, v: string) => {
        request.requestHeaders[n] = v;
      },
      send: (body: unknown) => {
        request.body = body;
      },
      abort: () => request.onabort?.(),
      // Ganchos de teste (fora do contrato real de XHR, só para o dublê ser dirigido).
      responde: (status: number, body = "") => {
        request.status = status;
        request.responseText = body;
        request.onload?.();
      },
    };
    return request;
  }

  const signedUrl = "https://bucket.example.com/put?X-Amz-Signature=abc";
  const arquivo = new File(["bytes"], "a.png", { type: "image/png" });

  it("reporta o progresso por bytes do PUT", async () => {
    const request = fakeXhr();
    vi.stubGlobal("XMLHttpRequest", function () {
      return request;
    });
    const progressos: number[] = [];
    const promessa = mediaApi.uploadToSignedUrl(signedUrl, arquivo, {}, (f) => progressos.push(f));
    await vi.waitFor(() => expect(request.body).toBe(arquivo));
    request.upload.onprogress!({ loaded: 300, total: 1000, lengthComputable: true });
    request.upload.onprogress!({ loaded: 1000, total: 1000, lengthComputable: true });
    request.responde(200);
    await promessa;
    expect(progressos).toEqual([0.3, 1]);
    vi.unstubAllGlobals();
  });

  it("aborta o PUT no meio e rejeita com AbortError", async () => {
    const request = fakeXhr();
    vi.stubGlobal("XMLHttpRequest", function () {
      return request;
    });
    const controller = new AbortController();
    const promessa = mediaApi.uploadToSignedUrl(
      signedUrl,
      arquivo,
      {},
      undefined,
      controller.signal,
    );
    await vi.waitFor(() => expect(request.body).toBe(arquivo));
    controller.abort();
    await expect(promessa).rejects.toMatchObject({ name: "AbortError" });
    vi.unstubAllGlobals();
  });

  it("recusa resposta de erro com o código da API (mesmo contrato do fetch)", async () => {
    const request = fakeXhr();
    vi.stubGlobal("XMLHttpRequest", function () {
      return request;
    });
    vi.stubGlobal("window", {
      location: { href: "https://app.example.com/feed", origin: "https://app.example.com" },
    });
    const promessa = mediaApi.uploadToSignedUrl("https://app.example.com/api/storage/k", arquivo);
    await vi.waitFor(() => expect(request.body).toBe(arquivo));
    request.responde(422, JSON.stringify({ code: "MEDIA_TOO_LARGE", message: "grande" }));
    await expect(promessa).rejects.toMatchObject({ status: 422, code: "MEDIA_TOO_LARGE" });
    vi.unstubAllGlobals();
  });
});
