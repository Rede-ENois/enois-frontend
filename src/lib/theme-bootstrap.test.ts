// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { THEME_BOOTSTRAP_SCRIPT } from "./theme-bootstrap";

/** O script é uma string que roda no `<head>`; aqui roda no mesmo documento. */
function run() {
  new Function(THEME_BOOTSTRAP_SCRIPT)();
}

describe("script de arranque", () => {
  afterEach(() => {
    window.localStorage.clear();
    const root = document.documentElement;
    for (const attribute of ["data-lite", "data-batata", "data-force-motion", "data-theme"]) {
      root.removeAttribute(attribute);
    }
    root.classList.remove("dark");
    for (const link of document.head.querySelectorAll("link")) link.remove();
    for (const style of document.head.querySelectorAll("style")) style.remove();
  });

  it("liga o BATATA e o lite antes do primeiro paint", () => {
    window.localStorage.setItem("connect-grow-batata-mode", "1");

    run();

    expect(document.documentElement.hasAttribute("data-batata")).toBe(true);
    // BATATA é superconjunto: os efeitos do lite valem junto, sem a chave do lite mudar.
    expect(document.documentElement.hasAttribute("data-lite")).toBe(true);
  });

  it("em BATATA não pede nenhuma fonte do Google", () => {
    window.localStorage.setItem("connect-grow-batata-mode", "1");

    run();

    expect(document.getElementById("enois-web-fonts")).toBeNull();
    expect(document.head.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull();
    expect(document.head.querySelector('link[href*="fonts.gstatic.com"]')).toBeNull();
  });

  it("sem modo econômico a fonte entra uma vez", () => {
    run();

    expect(document.getElementById("enois-web-fonts")).not.toBeNull();
    expect(document.documentElement.hasAttribute("data-lite")).toBe(false);
    expect(document.documentElement.hasAttribute("data-batata")).toBe(false);
  });

  it("com o armazenamento bloqueado a página ainda pede a fonte", () => {
    const real = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      run();
    } finally {
      if (real) Object.defineProperty(window, "localStorage", real);
    }

    expect(document.getElementById("enois-web-fonts")).not.toBeNull();
  });
});
