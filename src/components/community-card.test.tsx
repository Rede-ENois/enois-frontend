// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cardViews: [] as Record<string, unknown>[],
  frames: [] as Record<string, unknown>[],
}));

vi.mock("@rede-enois/design-system/domain", () => ({
  CommunityCard: (props: Record<string, unknown>) => {
    mocks.cardViews.push(props);
    return null;
  },
}));

vi.mock("@/components/banner-html-frame", () => ({
  BannerHtmlFrame: (props: Record<string, unknown>) => {
    mocks.frames.push(props);
    return null;
  },
}));

vi.mock("@/components/community-favorite-button", () => ({
  CommunityFavoriteButton: () => null,
}));

const { CommunityCard } = await import("./community-card");

const community = {
  id: "c1",
  name: "Devs BH",
  description: null,
  topic: null,
  members: 3,
  joined: false,
  cover: null,
  avatar: null,
};

describe("CommunityCard (wrapper)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.cardViews.length = 0;
    mocks.frames.length = 0;
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("injeta o renderizador do quadro isolado: a capa em HTML da comunidade aparece na listagem", async () => {
    await act(async () =>
      root.render(
        <CommunityCard
          community={community}
          joinPending={false}
          leavePending={false}
          ownerBlocked={false}
          onJoin={() => undefined}
          onLeave={() => undefined}
        />,
      ),
    );

    expect(mocks.cardViews).toHaveLength(1);
    expect(typeof mocks.cardViews[0].renderHtmlFrame).toBe("function");

    // O renderizador entregue ao card desenha o BannerHtmlFrame do app: renderizar o retorno
    // registra a chamada (a função só monta o elemento; quem desenha é o React).
    const props = { html: "<div>capa</div>", title: "Capa da comunidade" };
    const elemento = (
      mocks.cardViews[0].renderHtmlFrame as (p: typeof props) => React.ReactElement
    )(props);
    await act(async () => root.render(elemento));
    expect(mocks.frames).toEqual([props]);
  });
});
