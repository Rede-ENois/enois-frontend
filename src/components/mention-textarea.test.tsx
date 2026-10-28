import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CharCounter } from "@rede-enois/design-system/ui";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MentionTextarea } from "./mention-textarea";

const counterMarkup = renderToStaticMarkup(<CharCounter length={5} max={1200} />);

describe("MentionTextarea", () => {
  it("mostra o contador interno por padrão quando há limite", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MentionTextarea value="teste" onChange={() => undefined} maxLength={1200} />
      </QueryClientProvider>,
    );

    expect(html.split(counterMarkup)).toHaveLength(2);
  });

  it("permite um contador externo sem duplicar o anúncio nem perder o limite", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MentionTextarea
          value="teste"
          onChange={() => undefined}
          maxLength={1200}
          showCounter={false}
        />
        <CharCounter length={5} max={1200} />
      </QueryClientProvider>,
    );

    expect(html.split(counterMarkup)).toHaveLength(2);
    expect(html).toMatch(/maxLength="1200"/i);
  });
});
