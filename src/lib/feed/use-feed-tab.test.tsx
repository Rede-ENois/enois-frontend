// @vitest-environment jsdom
import { act } from "react";

import type { HomeTab } from "@/types/routes/feed/home-tab";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFeedTab } from "./use-feed-tab";

const KEY = "connect-grow-last-feed-tab";

describe("useFeedTab", () => {
  let root: Root;
  let host: HTMLDivElement;
  let probe: ReturnType<typeof useFeedTab>;
  let firstRender: { tab: string; ready: boolean } | undefined;
  const goToTab = vi.fn();

  /** Renders the hook the way `Home` uses it; `aba` is what the URL carries. */
  const mount = async (aba: HomeTab | undefined, professional = false) => {
    function Harness({ aba: current }: { aba: HomeTab | undefined }) {
      probe = useFeedTab(current, professional, goToTab);
      firstRender ??= { tab: probe.tab, ready: probe.ready };
      return null;
    }
    await act(async () => root.render(<Harness aba={aba} />));
    return (next: HomeTab | undefined) => act(async () => root.render(<Harness aba={next} />));
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    localStorage.clear();
    goToTab.mockReset();
    firstRender = undefined;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("renders Tudo first and not ready, so the server HTML and the hydration agree", async () => {
    localStorage.setItem(KEY, "TRENDING");
    await mount(undefined);
    expect(firstRender).toEqual({ tab: "ALL", ready: false });
    expect(probe.tab).toBe("TRENDING");
    expect(probe.ready).toBe(true);
  });

  it("is ready at once when the URL already says the tab", async () => {
    localStorage.setItem(KEY, "TRENDING");
    await mount("FOR_YOU");
    expect(firstRender).toEqual({ tab: "FOR_YOU", ready: true });
  });

  it("opens on Tudo when the URL has no tab and nothing was saved", async () => {
    await mount(undefined);
    expect(probe.tab).toBe("ALL");
  });

  it("opens on the saved tab when the URL has none", async () => {
    localStorage.setItem(KEY, "TRENDING");
    await mount(undefined);
    expect(probe.tab).toBe("TRENDING");
  });

  it("lets the URL win over the saved tab", async () => {
    localStorage.setItem(KEY, "TRENDING");
    await mount("FOR_YOU");
    expect(probe.tab).toBe("FOR_YOU");
  });

  it("saves the tab it switches to, so a new visit reopens on it", async () => {
    const rerender = await mount(undefined);
    await act(async () => probe.setTab("TRENDING"));
    expect(localStorage.getItem(KEY)).toBe("TRENDING");
    expect(goToTab).toHaveBeenCalledWith("TRENDING");

    await rerender(undefined);
    expect(probe.tab).toBe("TRENDING");
  });

  it("keeps the current tab when 'Início' drops ?aba= from the URL", async () => {
    const rerender = await mount(undefined);
    await act(async () => probe.setTab("INTERACTED"));
    await rerender("INTERACTED");
    expect(probe.tab).toBe("INTERACTED");

    await rerender(undefined);
    expect(probe.tab).toBe("INTERACTED");
  });

  it("treats a tab that arrived through the URL as the last one, for 'Início' and the next visit", async () => {
    localStorage.setItem(KEY, "TRENDING");
    const rerender = await mount("UNSEEN");
    expect(localStorage.getItem(KEY)).toBe("UNSEEN");

    await rerender(undefined);
    expect(probe.tab).toBe("UNSEEN");
  });

  it("does nothing when the chosen tab is already the open one", async () => {
    await mount("ALL");
    await act(async () => probe.setTab("ALL"));
    expect(goToTab).not.toHaveBeenCalled();
  });

  it("forces Corporativo on the professional interface and never saves it", async () => {
    localStorage.setItem(KEY, "FOR_YOU");
    await mount("ALL", true);
    expect(probe.tab).toBe("CORPORATE");
    expect(localStorage.getItem(KEY)).toBe("FOR_YOU");
  });

  it("sends ?aba=CORPORATE on the social interface to the last tab", async () => {
    localStorage.setItem(KEY, "TRENDING");
    await mount("CORPORATE");
    expect(probe.tab).toBe("TRENDING");
  });
});
