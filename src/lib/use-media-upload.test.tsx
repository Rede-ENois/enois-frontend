// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Regressão da issue #880: chamadas simultâneas de upload compartilhavam um único estado,
 * então o primeiro término sinalizava conclusão com outro ainda em andamento e o sucesso
 * de um irmão apagava a falha de outro. O estado precisa refletir o conjunto em curso,
 * não a última chamada.
 */

const mocks = vi.hoisted(() => ({ requestUpload: vi.fn(), uploadToSignedUrl: vi.fn() }));

vi.mock("@/lib/api/media", () => ({
  mediaApi: {
    requestUpload: mocks.requestUpload,
    uploadToSignedUrl: mocks.uploadToSignedUrl,
  },
}));

// O prepare reencoda imagem/vídeo com APIs que o jsdom não tem; aqui o arquivo preparado é o
// próprio arquivo — o que está sob prova é o estado concorrente, não a compressão.
vi.mock("@/lib/media-file-type", () => ({ normalizeImageType: async (f: File) => f }));
vi.mock("@/lib/compress-image", () => ({ compressImage: async (f: File) => f }));
vi.mock("@/lib/video-limit", () => ({
  MAX_VIDEO_BYTES: 10 * 1024 * 1024,
  checkVideoLimit: async () => ({ ok: true }),
  isVideoFile: () => false,
}));

const { useMediaUpload } = await import("./use-media-upload");

function file(name: string): File {
  return new File(["x"], name, { type: "image/png" });
}

const bridge = { current: null as ReturnType<typeof useMediaUpload> | null };

function HookProbe(): React.JSX.Element {
  const u = useMediaUpload();
  bridge.current = u;
  return (
    <div data-status={u.status} data-progress={String(u.progress)} data-error={u.error ?? ""} />
  );
}

async function mountState(): Promise<{
  root: Root;
  host: HTMLElement;
  snapshot: () => { status: string; progress: string; error: string };
}> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<HookProbe />));
  const el = () => host.firstElementChild as HTMLElement;
  return {
    root,
    host,
    snapshot: () => ({
      status: el().dataset.status ?? "",
      progress: el().dataset.progress ?? "",
      error: el().dataset.error ?? "",
    }),
  };
}

describe("useMediaUpload com envios simultâneos", () => {
  it("só conclui quando o último envio em curso termina", async () => {
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const gateFirst = new Promise<void>((r) => (releaseFirst = r));
    const gateSecond = new Promise<void>((r) => (releaseSecond = r));
    mocks.requestUpload.mockResolvedValue({
      id: "m",
      cdnUrl: "https://cdn/m",
      uploadUrl: "https://s3/put",
      provider: "S3",
      uploadHeaders: {},
    });
    mocks.uploadToSignedUrl.mockImplementationOnce(() => gateFirst);
    mocks.uploadToSignedUrl.mockImplementationOnce(() => gateSecond);

    const { root, host, snapshot } = await mountState();
    const u = bridge.current!;
    let first!: Promise<unknown>;
    await act(async () => {
      first = u.upload(file("a.png"));
    });
    await act(async () => {
      u.upload(file("b.png"));
    });

    expect(snapshot().status).toBe("uploading");
    await act(async () => {
      releaseFirst();
    });
    await act(async () => first);

    // O primeiro terminou, mas o segundo ainda está no ar: nada de "done".
    expect(snapshot().status).toBe("uploading");
    await act(async () => {
      releaseSecond();
    });
    await act(async () => {});
    expect(snapshot().status).toBe("done");
    root.unmount();
    host!.remove();
  });

  it("falha de um irmão não é apagada pelo sucesso do outro", async () => {
    let releaseFail!: () => void;
    let releaseOk!: () => void;
    const gateFail = new Promise<void>((_, reject) => {
      releaseFail = () => reject(new Error("rede caiu"));
    });
    const gateOk = new Promise<void>((r) => (releaseOk = r));
    mocks.requestUpload.mockResolvedValue({
      id: "m",
      cdnUrl: "https://cdn/m",
      uploadUrl: "https://s3/put",
      provider: "S3",
      uploadHeaders: {},
    });
    mocks.uploadToSignedUrl.mockImplementationOnce(() => gateFail);
    mocks.uploadToSignedUrl.mockImplementationOnce(() => gateOk);

    const { root, host, snapshot } = await mountState();
    const u = bridge.current!;
    let failing!: Promise<unknown>;
    await act(async () => {
      failing = u.upload(file("ruim.png")).catch(() => undefined);
    });
    await act(async () => {
      u.upload(file("bom.png"));
    });

    await act(async () => {
      releaseFail();
    });
    await act(async () => failing);

    // O quebrado falhou, mas o bom ainda está no ar: o erro só se firma quando o conjunto termina.
    expect(snapshot().status).toBe("uploading");
    await act(async () => {
      releaseOk();
    });
    await act(async () => {});

    expect(snapshot().status).toBe("error");
    expect(snapshot().error).toBe("rede caiu");
    root.unmount();
    host!.remove();
  });
});
