// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileQuickComposer } from "./profile-quick-composer";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  uploadAll: vi.fn(),
  create: vi.fn(),
  // O composer visual vem do design system; aqui ele só expõe o onPublish para o teste acioná-lo.
  onPublish: null as null | ((payload: unknown) => Promise<boolean>),
}));

vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileQuickComposer: (props: { onPublish: (payload: unknown) => Promise<boolean> }) => {
    mocks.onPublish = props.onPublish;
    return null;
  },
}));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ status: "idle", progress: 0, uploadAll: mocks.uploadAll }),
}));
vi.mock("@/lib/api", () => ({ feedApi: { create: mocks.create } }));

const payload = {
  content: "oi",
  files: [new File(["x"], "a.png", { type: "image/png" })],
  mediaSpoiler: false,
};

describe("ProfileQuickComposer (perfil): falha de envio de mídia", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.toast.mockReset();
    mocks.uploadAll.mockReset();
    mocks.create.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <ProfileQuickComposer profile={{ id: "u1" } as never} />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("avisa a pessoa e não publica quando o envio da mídia falha", async () => {
    mocks.uploadAll.mockRejectedValue(new Error("O envio de mídia está desativado."));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await mocks.onPublish!(payload);
    });

    expect(ok).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith("O envio de mídia está desativado.", "error");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("publica com os ids das mídias quando o envio dá certo", async () => {
    mocks.uploadAll.mockResolvedValue([{ mediaId: "m1", cdnUrl: "x" }]);
    mocks.create.mockResolvedValue({});

    let ok: boolean | undefined;
    await act(async () => {
      ok = await mocks.onPublish!(payload);
    });

    expect(ok).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ mediaIds: ["m1"] }));
  });
});
