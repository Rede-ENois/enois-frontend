// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * O rodapé da landing explica de onde vem a arte que não é nossa. O crédito do Kenney saiu
 * separado do aviso das figurinhas e a Mel pediu os dois juntos — este teste prende os dois na
 * mesma coluna do rodapé, na ordem em que a pessoa lê.
 */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  redirect: () => undefined,
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/api", () => ({
  statsApi: { landing: vi.fn(() => new Promise(() => undefined)) },
}));
vi.mock("@/lib/session", () => ({ hasSessionFlag: () => false }));
vi.mock("@/components/contribution-form", () => ({
  ContributionForm: () => <form aria-label="contribuir" />,
}));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => <button type="button" /> }));

const { Route } = await import("./index");
const Landing = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = () =>
  act(() => {
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <Landing />
      </QueryClientProvider>,
    );
  });

describe("rodapé da landing", () => {
  it("mostra o crédito do Kenney logo depois do aviso das figurinhas, na mesma coluna", () => {
    render();

    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();

    const emotes = Array.from(footer!.querySelectorAll("p")).find(
      (p) => p.textContent === texts.landing.footer.emotesTitle,
    );
    const kenney = Array.from(footer!.querySelectorAll("p")).find(
      (p) => p.textContent === texts.landing.footer.kenneyTitle,
    );
    expect(emotes).toBeDefined();
    expect(kenney).toBeDefined();

    // O título do Kenney vem depois da figurinha na leitura da página.
    expect(
      emotes!.compareDocumentPosition(kenney!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const emotesBlock = emotes!.parentElement!;
    const kenneyBlock = kenney!.parentElement!;
    expect(emotesBlock.parentElement).toBe(kenneyBlock.parentElement);
    expect(kenneyBlock.previousElementSibling).toBe(emotesBlock);
    expect(kenneyBlock.parentElement?.className).toContain("space-y-3");

    // E diz o que importa: de quem é a arte e sob qual licença ela veio.
    const body = kenneyBlock.textContent ?? "";
    expect(body).toContain(texts.landing.footer.kenney);
    expect(body).toContain("CC0 1.0");

    const credit = kenneyBlock.querySelector("a[href='https://kenney.nl']");
    expect(credit).not.toBeNull();
    expect(credit!.getAttribute("target")).toBe("_blank");
    expect(credit!.getAttribute("rel")).toBe("noopener noreferrer");
    expect(credit!.textContent).toContain(texts.landing.footer.kenneyCredit);
  });
});
