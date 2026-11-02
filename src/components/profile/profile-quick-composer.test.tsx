// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { takeComposerFiles } from "@/lib/composer-handoff";

import { ProfileQuickComposer } from "./profile-quick-composer";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  // The view comes from the design system; here it only exposes its callbacks.
  view: null as null | {
    onCompose: () => void;
    onComposeWithMedia: (files: File[]) => void;
    onWriteArticle?: () => void;
  },
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@rede-enois/design-system/domain", () => ({
  ProfileQuickComposer: (props: NonNullable<typeof mocks.view>) => {
    mocks.view = props;
    return null;
  },
}));

describe("ProfileQuickComposer (perfil): atalhos para o compositor do feed", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.navigate.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(<ProfileQuickComposer profile={{ id: "u1" } as never} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    takeComposerFiles();
  });

  it("opens the feed composer, where type and topic are chosen", () => {
    mocks.view?.onCompose();

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed" });
  });

  it("hands the picked files to the feed composer", () => {
    const photo = new File(["x"], "a.png", { type: "image/png" });

    mocks.view?.onComposeWithMedia([photo]);

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed", search: { compor: "MEDIA" } });
    expect(takeComposerFiles()).toEqual([photo]);
    expect(takeComposerFiles()).toEqual([]);
  });

  it("opens the feed composer in article mode", () => {
    mocks.view?.onWriteArticle?.();

    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/feed", search: { compor: "ARTICLE" } });
  });
});
