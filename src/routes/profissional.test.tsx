// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  updateDetails: vi.fn(),
  upload: vi.fn(),
  crop: null as null | { aspect: number; onCropComplete: (blob: Blob) => Promise<void> },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  corporateApi: { me: mocks.me, updateDetails: mocks.updateDetails },
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
