import { createElement } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./__root";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    useRouter: () => ({ options: { ssr: { nonce: "nonce-test" } } }),
    HeadContent: () => null,
    Scripts: () => null,
  };
});

/**
 * Os ícones da aba abrem o `<head>` do shell diretamente, antes do `HeadContent`, para saírem
 * nos primeiros bytes do documento (evitando flash do favicon padrão). Estes testes fixam que
 * o shell declara exatamente o `.svg` e o `.ico` com os quatro tamanhos e sem o `/vite.svg`.
 */
function renderShellHead(): string {
  const options = Route.options as unknown as {
    shellComponent?: (props: { children: null }) => React.ReactElement | null;
  };
  const Shell = options.shellComponent;
  if (!Shell) throw new Error("shellComponent não encontrado no Route");
  const html = renderToStaticMarkup(createElement(Shell, { children: null }));
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
  return headMatch ? headMatch[1] : html;
}

describe("head do app — ícones da aba", () => {
  it("declara só o vetor com o ladrilho e o .ico nos primeiros bytes do shell", () => {
    const head = renderShellHead();
    expect(head).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>');
    expect(head).toContain(
      '<link rel="icon" type="image/vnd.microsoft.icon" sizes="16x16 32x32 48x48 64x64" href="/favicon.ico"/>',
    );
    expect(head).not.toContain("/vite.svg");
  });

  it("declara todos os tamanhos que o contêiner .ico tem de verdade", () => {
    const head = renderShellHead();
    expect(head).toMatch(/sizes="16x16 32x32 48x48 64x64"/);
    expect(head).toMatch(/type="image\/vnd\.microsoft\.icon"/);
  });
});
