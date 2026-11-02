// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readStoredContext } from "@/lib/interface-context";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  create: vi.fn(),
  updateDetails: vi.fn(),
  upload: vi.fn(),
  crop: null as null | { aspect: number; onCropComplete: (blob: Blob) => Promise<void> },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  corporateApi: { me: mocks.me, create: mocks.create, updateDetails: mocks.updateDetails },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ upload: mocks.upload, status: "idle" }),
}));
vi.mock("@rede-enois/design-system/patterns", () => ({
  ImageCropDialog: (props: NonNullable<typeof mocks.crop>) => {
    mocks.crop = props;
    return <div data-testid="crop" />;
  },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./profissional");
const Profissional = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

describe("/profissional picture", () => {
  let root: Root;
  let host: HTMLDivElement;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const pick = async (file: File) => {
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
  };

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    URL.createObjectURL = vi.fn(() => "blob:picked");
    URL.revokeObjectURL = vi.fn();
    mocks.crop = null;
    mocks.upload.mockReset().mockResolvedValue({ cdnUrl: "cdn/avatar.jpg" });
    mocks.updateDetails.mockReset().mockResolvedValue({});
    mocks.me.mockReset().mockResolvedValue({
      exists: true,
      active: true,
      username: "rita.design",
      name: "Rita",
      headline: "",
      bio: "",
      location: "",
      industry: "",
      externalLinks: "",
      avatar: "",
      banner: "",
      bannerHtml: "",
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <Profissional />
        </QueryClientProvider>,
      ),
    );
    await settle();
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("frames a photo before it goes up, like the personal profile", async () => {
    await pick(new File(["x"], "me.png", { type: "image/png" }));

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.crop?.aspect).toBe(1);

    await act(() => mocks.crop!.onCropComplete(new Blob(["y"], { type: "image/jpeg" })));

    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), "AVATAR");
    expect(mocks.updateDetails).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: "cdn/avatar.jpg" }),
    );
    expect(host.querySelector('[data-testid="crop"]')).toBeNull();
  });

  it("sends a GIF as is, so it keeps moving", async () => {
    await pick(new File(["x"], "me.gif", { type: "image/gif" }));

    expect(mocks.crop).toBeNull();
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), "AVATAR");
  });
});

describe("/profissional criação", () => {
  let root: Root;
  let host: HTMLDivElement;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const fill = async (label: string, value: string) => {
    const input = host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
    await act(async () => {
      // React reads the value off the controlled input: go through the native setter.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    window.localStorage.clear();
    mocks.create.mockReset().mockResolvedValue({});
    // Sem perfil profissional ainda: a tela mostra o formulário de criação.
    mocks.me.mockReset().mockResolvedValue({ exists: false, active: false });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <Profissional />
        </QueryClientProvider>,
      ),
    );
    await settle();
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("entra no perfil profissional ao criar, para o aviso do menu aparecer com contexto", async () => {
    await fill(texts.corporate.username, "rita.design");
    await fill(texts.corporate.name, "Rita");

    const botao = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(texts.corporate.create),
    )!;
    await act(async () => botao.click());
    await settle();

    expect(mocks.create).toHaveBeenCalledWith("rita.design", "Rita");
    expect(readStoredContext()).toBe("PROFESSIONAL");
  });
});
