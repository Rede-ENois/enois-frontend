// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ frames: [] as Record<string, unknown>[] }));

vi.mock("@/components/post/sandboxed-html-frame", () => ({
  SandboxedHtmlFrame: (props: Record<string, unknown>) => {
    mocks.frames.push(props);
    return null;
  },
}));

const { BannerHtmlFrame } = await import("./banner-html-frame");

describe("BannerHtmlFrame", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.frames.length = 0;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("fills the strip: no frame padding and no height from the content", async () => {
    await act(async () =>
      root.render(<BannerHtmlFrame html="<div>capa</div>" title="Capa" className="h-40 w-full" />),
    );

    expect(mocks.frames).toHaveLength(1);
    expect(mocks.frames[0]).toMatchObject({
      html: "<div>capa</div>",
      title: "Capa",
      className: "h-40 w-full",
      innerPadding: false,
      autoHeight: false,
    });
  });
});
