// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GalaxiaFx } from "./galaxia";

describe("Galáxia no avatar", () => {
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

  it("compartilha cinco imagens decorativas e um observer entre dois avatares", async () => {
    await act(async () =>
      root.render(
        <>
          <GalaxiaFx />
          <GalaxiaFx />
        </>,
      ),
    );
    const images = [...host.querySelectorAll("img")];
    expect(images).toHaveLength(10);
    expect(new Set(images.map((image) => image.src)).size).toBe(5);
    expect(
      images.every((image) => image.alt === "" && image.getAttribute("loading") === "lazy"),
    ).toBe(true);
    expect(createObserver).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(2);
    expect(host.querySelector("svg, canvas")).toBeNull();
  });

  it("pausa fora da tela e na aba oculta; limpa os recursos e ignora callbacks atrasados", async () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    await act(async () =>
      root.render(
        <>
          <GalaxiaFx />
          <GalaxiaFx />
        </>,
      ),
    );
    const [first, second] = [...host.querySelectorAll(".moldura-galaxia")];
    intersect(first, true);
    intersect(second, false);
    expect(first.classList.contains("moldura-galaxia--ativa")).toBe(true);
    expect(second.classList.contains("moldura-galaxia--ativa")).toBe(false);

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(first.classList.contains("moldura-galaxia--ativa")).toBe(false);
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(first.classList.contains("moldura-galaxia--ativa")).toBe(true);
    expect(second.classList.contains("moldura-galaxia--ativa")).toBe(false);

    intersect(first, false);
    expect(first.classList.contains("moldura-galaxia--ativa")).toBe(false);
    await act(async () => root.render(null));
    expect(unobserve).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    intersect(first, true);
    expect(first.classList.contains("moldura-galaxia--ativa")).toBe(false);
  });

  it("mantém a pausa da aba mesmo sem IntersectionObserver", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    await act(async () => root.render(<GalaxiaFx />));
    const galaxy = host.querySelector(".moldura-galaxia")!;
    expect(galaxy.classList.contains("moldura-galaxia--ativa")).toBe(true);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(galaxy.classList.contains("moldura-galaxia--ativa")).toBe(false);
    expect(createObserver).not.toHaveBeenCalled();
  });
});
