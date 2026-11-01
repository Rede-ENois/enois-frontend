// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfessionalComposerNotice } from "./professional-composer-notice";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("aviso do compositor profissional", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const buttons = () => [...host.querySelectorAll<HTMLButtonElement>("button")];

  it("na falha da consulta mostra o erro com tentar de novo, não o convite de configuração", () => {
    const onRetry = vi.fn();
    act(() => root.render(<ProfessionalComposerNotice state="ERROR" onRetry={onRetry} />));

    expect(host.textContent).toContain(texts.feed.composer.professionalLoadErrorTitle);
    expect(host.textContent).not.toContain(texts.feed.composer.professionalSetupTitle);
    expect(host.querySelector('a[href="/profissional"]')).toBeNull();

    act(() =>
      buttons()
        .find((b) => b.textContent === "Tentar de novo")
        ?.click(),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("desabilita tentar de novo enquanto a consulta roda", () => {
    act(() => root.render(<ProfessionalComposerNotice state="ERROR" onRetry={vi.fn()} retrying />));

    expect(buttons().find((b) => b.textContent === "Tentar de novo")?.disabled).toBe(true);
  });

  it("sem perfil ativo convida a configurar", () => {
    act(() => root.render(<ProfessionalComposerNotice state="NOT_READY" onRetry={vi.fn()} />));

    expect(host.textContent).toContain(texts.feed.composer.professionalSetupTitle);
    expect(host.querySelector('a[href="/profissional"]')).not.toBeNull();
    expect(buttons().some((b) => b.textContent === "Tentar de novo")).toBe(false);
  });
});
