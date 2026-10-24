// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserAvatar } from "./user-avatar";

describe("Animação das molduras do avatar", () => {
  let root: Root;
  let host: HTMLDivElement;
  let hidden = false;
  let callback: IntersectionObserverCallback;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();
  const createObserver = vi.fn(function (onChange: IntersectionObserverCallback) {
    callback = onChange;
    return { observe, unobserve, disconnect };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    hidden = false;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("IntersectionObserver", createObserver);
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function intersect(target: Element, isIntersecting: boolean) {
    callback([{ target, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
  }

  it("não observa avatares sem animação", async () => {
    const addListener = vi.spyOn(document, "addEventListener");
    await act(async () =>
      root.render(
        <>
          <UserAvatar />
          <UserAvatar frame="moldura-ambar" />
        </>,
      ),
    );
    expect(createObserver).not.toHaveBeenCalled();
    expect(addListener.mock.calls.filter(([name]) => name === "visibilitychange")).toHaveLength(0);
    expect(host.querySelector("[data-avatar-animated]")).toBeNull();
  });

  it("compartilha um observer e um listener entre molduras SVG, elementos HTML e anéis CSS", async () => {
    const addListener = vi.spyOn(document, "addEventListener");
    await act(async () =>
      root.render(
        <>
          <UserAvatar frame="moldura-toxica" />
          <UserAvatar frame="moldura-orbita" />
          <UserAvatar frame="moldura-aurora" />
        </>,
      ),
    );
    expect(createObserver).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(3);
    expect(addListener.mock.calls.filter(([name]) => name === "visibilitychange")).toHaveLength(1);
    expect(host.querySelectorAll("[data-avatar-animated]")).toHaveLength(3);
    expect(host.querySelector("[data-avatar-animating]")).toBeNull();
  });

  it("pausa fora da tela e na aba oculta e retoma apenas as molduras visíveis", async () => {
    await act(async () =>
      root.render(
        <>
          <UserAvatar frame="moldura-toxica" />
          <UserAvatar frame="moldura-pulsar" />
        </>,
      ),
    );
    const [first, second] = [...host.querySelectorAll("[data-avatar-animated]")];
    intersect(first, true);
    intersect(second, false);
    expect(first.hasAttribute("data-avatar-animating")).toBe(true);
    expect(second.hasAttribute("data-avatar-animating")).toBe(false);

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(first.hasAttribute("data-avatar-animating")).toBe(false);
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(first.hasAttribute("data-avatar-animating")).toBe(true);
    expect(second.hasAttribute("data-avatar-animating")).toBe(false);

    intersect(first, false);
    expect(first.hasAttribute("data-avatar-animating")).toBe(false);
  });

  it("libera recursos ao desmontar e ignora callbacks atrasados", async () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    await act(async () => root.render(<UserAvatar frame="moldura-glacial" />));
    const avatar = host.querySelector("[data-avatar-animated]")!;
    intersect(avatar, true);
    await act(async () => root.render(null));
    expect(unobserve).toHaveBeenCalledWith(avatar);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    intersect(avatar, true);
    expect(avatar.hasAttribute("data-avatar-animating")).toBe(false);
  });

  it("acompanha a troca entre moldura com efeito, anel animado e moldura simples", async () => {
    await act(async () => root.render(<UserAvatar frame="moldura-orbita" />));
    const previous = host.querySelector("[data-avatar-animated]")!;
    intersect(previous, true);
    await act(async () => root.render(<UserAvatar frame="moldura-aurora" />));
    const next = host.querySelector("[data-avatar-animated]")!;
    expect(next).not.toBe(previous);
    expect(unobserve).toHaveBeenCalledWith(previous);
    expect(observe).toHaveBeenLastCalledWith(next);
    expect(next.hasAttribute("data-avatar-animating")).toBe(false);
    intersect(next, true);
    expect(next.hasAttribute("data-avatar-animating")).toBe(true);
    await act(async () => root.render(<UserAvatar frame="moldura-ambar" />));
    expect(host.querySelector("[data-avatar-animated]")).toBeNull();
    expect(host.querySelector("[data-avatar-animating]")).toBeNull();
  });

  it("mantém a pausa da aba mesmo sem IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    await act(async () => root.render(<UserAvatar frame="moldura-inferno" />));
    const avatar = host.querySelector("[data-avatar-animated]")!;
    expect(avatar.hasAttribute("data-avatar-animating")).toBe(true);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(avatar.hasAttribute("data-avatar-animating")).toBe(false);
    expect(createObserver).not.toHaveBeenCalled();
  });
});
