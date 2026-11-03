// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MediaGridProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaGrid } from "./media-grid";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ get: vi.fn(), items: [] as MediaGridProps["items"] }));

vi.mock("@/lib/api", () => ({ mediaApi: { get: mocks.get } }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/feed/video-autoplay", () => ({ autoplayVideoRef: vi.fn() }));
// The DS grid is a probe: under test is what the container feeds into it.
vi.mock("@rede-enois/design-system/domain", () => ({
  MediaGrid: ({ items }: MediaGridProps) => {
    mocks.items = items;
    return null;
  },
}));

const known = (id: string) => ({
  id,
  cdnUrl: `/uploads/${id}.webp`,
  mimeType: "image/webp",
  width: 1200,
  height: 900,
});

describe("MediaGrid container", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    mocks.get.mockReset();
    mocks.items = [];
    container = document.createElement("div");
    root = createRoot(container);
  });

  afterEach(() => act(() => root.unmount()));

  const render = async (node: React.ReactNode) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () =>
      root.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>),
    );
  };

  it("draws the media sent with the post, with its size, without one request per file", async () => {
    await render(<MediaGrid mediaIds={["m1", "m2"]} known={[known("m2"), known("m1")]} />);

    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.items.map((item) => item.id)).toEqual(["m1", "m2"]);
    expect(mocks.items[0]).toMatchObject({ width: 1200, height: 900 });
  });

  it("fetches only what did not come with the post", async () => {
    mocks.get.mockResolvedValue({ id: "m3", cdnUrl: "/uploads/m3.webp", mimeType: "image/webp" });

    await render(<MediaGrid mediaIds={["m1", "m3"]} known={[known("m1")]} />);

    await vi.waitFor(() => expect(mocks.items.map((item) => item.id)).toEqual(["m1", "m3"]));
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith("m3");
  });
});
