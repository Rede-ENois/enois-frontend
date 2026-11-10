// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EnoisProvider } from "@rede-enois/design-system";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Documentos oficiais (Termos, Diretrizes e Política de Privacidade).
 *
 * O teste existe para travar duas coisas que a documentação não pode quebrar:
 * 1. o texto sobre chamadas e Tamo junto continua publicado nas três páginas;
 * 2. as promessas do texto continuam batendo com o comportamento real do produto — aqui o
 *    que dá para conferir pelo front: não existe gravação de áudio/vídeo de chamada, a denúncia
 *    em chamada fala em imagem estática e não em vídeo, e a captura é descrita como happening
 *    no momento da denúncia.
 */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

const { Route: TermosRoute } = await import("./termos");
const { Route: DiretrizesRoute } = await import("./diretrizes");
const { Route: PrivacidadeRoute } = await import("./privacidade");

const Termos = (TermosRoute as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;
const Diretrizes = (
  DiretrizesRoute as unknown as { options: { component: () => React.JSX.Element } }
).options.component;
const Privacidade = (
  PrivacidadeRoute as unknown as { options: { component: () => React.JSX.Element } }
).options.component;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("documentos oficiais", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const render = async (Page: () => React.JSX.Element) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <EnoisProvider>
            <Page />
          </EnoisProvider>
        </QueryClientProvider>,
      ),
    );
  };

  it("Termos de Uso traz a seção de chamadas com o que a plataforma realmente faz", async () => {
    await render(Termos);

    const texto = host.textContent ?? "";
    expect(texto).toContain("16. Chamadas de voz e vídeo e salas abertas");
    expect(texto).toContain("imagem estática");
    expect(texto).toContain("não são gravadas em áudio ou vídeo");
    // A decisão final é humana: o texto não pode sugerir que o bot pune sozinho.
    expect(texto).toContain("decidida por uma pessoa do time de moderação");
  });

  it("Termos de Uso e Diretrizes trazem a regra de 16 anos com supervisão", async () => {
    await render(Termos);
    const termos = host.textContent ?? "";
    // A regra real do código: cadastro a partir de 16, supervisão de um adulto até os 18.
    expect(termos).toContain("A idade mínima para criar conta é 16 anos");
    expect(termos).toContain("menor supervisionado");
    expect(termos).toContain("Completar 18 anos encerra a exigência de supervisão");
    expect(termos).not.toContain("destinada exclusivamente a pessoas com 18 anos ou mais");

    await render(Diretrizes);
    const diretrizes = host.textContent ?? "";
    expect(diretrizes).toContain("Contas de 16 e 17 anos");
    expect(diretrizes).toContain("não entra em chamadas");

    await render(Privacidade);
    const privacidade = host.textContent ?? "";
    expect(privacidade).toContain("A idade mínima para criar conta é 16 anos");
  });

  it("Diretrizes explicam conduta em chamada, denúncia e o limite da prova", async () => {
    await render(Diretrizes);

    const texto = host.textContent ?? "";
    expect(texto).toContain("Chamadas e salas abertas (Tamo junto)");
    expect(texto).toContain("Denúncias em chamadas");
    expect(texto).toContain("não é feita gravação de áudio ou de vídeo");
    expect(texto).toContain("sem aviso para as outras pessoas da chamada");
    // A lista é desenhada pelo renderizador de texto do design system.
    expect(host.querySelectorAll("li").length).toBeGreaterThan(0);
  });

  it("Política de Privacidade descreve os dados de chamada e o pedido de autoridades", async () => {
    await render(Privacidade);

    const texto = host.textContent ?? "";
    expect(texto).toContain("Chamadas de voz e vídeo e salas abertas");
    expect(texto).toContain("não têm criptografia ponta a ponta");
    expect(texto).toContain("Pedidos de autoridades");
    expect(texto).toContain("não existe áudio ou vídeo de chamadas a disponibilizar");
  });
});
