// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReplyNavigation } from "./use-reply-navigation";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const notify = vi.fn();
const loadOlder = vi.fn(async (_messageId: string, _signal: AbortSignal) => ({
  targetLoaded: false,
  nextCursor: null as string | null,
}));

function Harness({
  onNavigation,
  options = {},
  renderedIds = ["original"],
}: {
  onNavigation: (navigation: ReturnType<typeof useReplyNavigation>) => void;
  options?: Partial<Parameters<typeof useReplyNavigation>[0]>;
  renderedIds?: string[];
}) {
  const navigation = useReplyNavigation({
    conversationId: "conversation-a",
    enabled: true,
    loadedMessageIds: new Set(["original"]),
    nextCursor: "older",
    loadOlder,
    notify,
    ...options,
  });
  onNavigation(navigation);
  return (
    <div ref={navigation.messagesScrollRef}>
      {renderedIds.map((id) => (
        <div key={id} id={`message-${id}`} tabIndex={-1} />
      ))}
    </div>
  );
}

describe("navegação para a mensagem citada", () => {
  let root: Root;
  let host: HTMLDivElement;
  let navigation: ReturnType<typeof useReplyNavigation>;

  beforeEach(() => {
    notify.mockReset();
    loadOlder.mockReset().mockResolvedValue({ targetLoaded: false, nextCursor: null });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const render = async (
    options: Partial<Parameters<typeof useReplyNavigation>[0]> = {},
    renderedIds: string[] = [],
  ) => {
    await act(() =>
      root.render(
        <Harness
          options={options}
          renderedIds={renderedIds}
          onNavigation={(value) => (navigation = value)}
        />,
      ),
    );
    const scroller = host.firstElementChild as HTMLDivElement;
    scroller.scrollTo = vi.fn();
    return scroller;
  };

  it("interrompe cursores repetidos em vez de buscar a mesma página novamente", async () => {
    await render({ loadedMessageIds: new Set() });
    loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: "older" });

    await act(() => navigation.navigateToReply("missing"));

    expect(loadOlder).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenLastCalledWith("error");
  });

  it("encerra com erro explícito após quinze segundos sem renderização", async () => {
    vi.useFakeTimers();
    try {
      const scroller = await render();
      let pending: Promise<void>;
      act(() => {
        pending = navigation.navigateToReply("original");
      });
      await act(() => vi.advanceTimersByTimeAsync(15_000));

      expect(navigation.navigating).toBe(false);
      expect(notify).toHaveBeenLastCalledWith("error");
      expect(scroller.scrollTo).not.toHaveBeenCalled();
      await pending!;
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("limita cada clique a dez páginas e informa que a busca não foi concluída", async () => {
    await render({ loadedMessageIds: new Set() });
    for (let page = 1; page <= 10; page++) {
      loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: `cursor-${page}` });
    }
    loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: null });

    await act(() => navigation.navigateToReply("very-old"));

    expect(loadOlder).toHaveBeenCalledTimes(10);
    expect(notify).toHaveBeenLastCalledWith("error");
    expect(navigation.navigating).toBe(false);
  });

  it("ignora cliques no histórico placeholder de outra conversa", async () => {
    const scroller = await render({ enabled: false }, ["original"]);

    await act(() => navigation.navigateToReply("original"));

    expect(scroller.scrollTo).not.toHaveBeenCalled();
    expect(loadOlder).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("cancela também a espera pela renderização sem focar outra conversa", async () => {
    const scroller = await render();
    let settled = false;
    act(() => {
      void navigation.navigateToReply("original").then(() => {
        settled = true;
      });
    });
    await render({ conversationId: "conversation-b" });

    expect(settled).toBe(true);
    const target = document.createElement("div");
    target.id = "message-original";
    target.tabIndex = -1;
    await act(async () => {
      scroller.append(target);
    });
    expect(scroller.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(target);
    expect(notify.mock.calls).toEqual([["loading"]]);
  });

  it("cancela ao trocar de conversa e ignora a resposta atrasada", async () => {
    const scroller = await render({ loadedMessageIds: new Set() });
    let resolvePage: (value: {
      targetLoaded: boolean;
      nextCursor: string | null;
    }) => void = () => {};
    loadOlder.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    let pending: Promise<void>;
    act(() => {
      pending = navigation.navigateToReply("original");
    });
    await render({ conversationId: "conversation-b" }, ["original"]);
    const scrollTo = scroller.scrollTo;
    await act(async () => {
      resolvePage({ targetLoaded: true, nextCursor: "must-not-load" });
      await pending;
    });

    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement?.id).not.toBe("message-original");
    expect(loadOlder).toHaveBeenCalledOnce();
    expect(notify.mock.calls).toEqual([["loading"]]);
    expect(navigation.navigating).toBe(false);
    await act(() => navigation.navigateToReply("original"));
    expect(scrollTo).toHaveBeenCalledOnce();
  });

  it("deduplica cliques enquanto a página anterior está pendente", async () => {
    await render({ loadedMessageIds: new Set() });
    let resolvePage: (value: {
      targetLoaded: boolean;
      nextCursor: string | null;
    }) => void = () => {};
    loadOlder.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    let pending: Promise<void>;
    let duplicate: Promise<void>;
    act(() => {
      pending = navigation.navigateToReply("original");
      duplicate = navigation.navigateToReply("other-original");
    });

    expect(navigation.navigating).toBe(true);
    expect(loadOlder).toHaveBeenCalledOnce();
    await act(async () => {
      resolvePage({ targetLoaded: false, nextCursor: null });
      await Promise.all([pending, duplicate]);
    });
    expect(notify.mock.calls).toEqual([["loading"], ["unavailable"]]);
  });

  it("mostra erro de busca e permite tentar de novo", async () => {
    await render({ loadedMessageIds: new Set() });
    loadOlder.mockRejectedValueOnce(new Error("falha de rede sintética"));

    await act(() => navigation.navigateToReply("original"));

    expect(notify).toHaveBeenLastCalledWith("error");
    expect(navigation.navigating).toBe(false);
    loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: null });
    await act(() => navigation.navigateToReply("original"));
    expect(loadOlder).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenLastCalledWith("unavailable");
  });

  it("informa indisponibilidade quando o histórico acaba sem o original", async () => {
    await render({ loadedMessageIds: new Set() });
    loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: null });

    await act(() => navigation.navigateToReply("removed"));

    expect(loadOlder).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenLastCalledWith("unavailable");
    expect(navigation.navigating).toBe(false);
  });

  it("aguarda o original já carregado ser renderizado sem buscar mais páginas", async () => {
    const scroller = await render();
    let pending: Promise<void>;
    act(() => {
      pending = navigation.navigateToReply("original");
    });
    expect(navigation.navigating).toBe(true);
    const target = document.createElement("div");
    target.id = "message-original";
    target.tabIndex = -1;
    await act(async () => {
      scroller.append(target);
    });
    await act(() => pending);

    expect(document.activeElement).toBe(target);
    expect(loadOlder).not.toHaveBeenCalled();
    expect(navigation.navigating).toBe(false);
  });

  it("busca páginas sequenciais e para assim que o original aparece", async () => {
    const scroller = await render({ loadedMessageIds: new Set() });
    loadOlder.mockResolvedValueOnce({ targetLoaded: false, nextCursor: "older-2" });
    loadOlder.mockImplementationOnce(async () => {
      const target = document.createElement("div");
      target.id = "message-original";
      target.tabIndex = -1;
      scroller.append(target);
      return { targetLoaded: true, nextCursor: "unneeded-page" };
    });

    await act(() => navigation.navigateToReply("original"));

    expect(loadOlder).toHaveBeenCalledTimes(2);
    expect(loadOlder).toHaveBeenNthCalledWith(1, "original", expect.any(AbortSignal));
    expect(loadOlder).toHaveBeenNthCalledWith(2, "original", loadOlder.mock.calls[0][1]);
    expect(scroller.scrollTo).toHaveBeenCalledOnce();
    expect(document.activeElement?.id).toBe("message-original");
    expect(notify).toHaveBeenCalledExactlyOnceWith("loading");
    expect(navigation.navigating).toBe(false);
  });

  it("rola e foca apenas o original nesta thread sem buscar histórico já renderizado", async () => {
    const duplicate = document.createElement("div");
    duplicate.id = "message-original";
    duplicate.tabIndex = -1;
    document.body.prepend(duplicate);
    try {
      await act(() => root.render(<Harness onNavigation={(value) => (navigation = value)} />));
      const scroller = host.firstElementChild as HTMLDivElement;
      const scrollTo = vi.fn();
      scroller.scrollTo = scrollTo;
      const target = host.querySelector<HTMLElement>("#message-original")!;
      vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 100, 300, 400));
      vi.spyOn(target, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 500, 300, 80));
      Object.defineProperty(scroller, "clientHeight", { value: 400 });

      await act(() => navigation.navigateToReply("original"));

      expect(scrollTo).toHaveBeenCalledWith({ top: 240, behavior: "smooth" });
      expect(document.activeElement).toBe(target);
      expect(loadOlder).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    } finally {
      duplicate.remove();
    }
  });
});
