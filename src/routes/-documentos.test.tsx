// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { EnoisProvider } from "@rede-enois/design-system";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Meus documentos": o texto em vigor, o que falta aceitar e o aceite explícito.
 *
 * O que o teste trava: abrir a página NÃO aceita nada; o aceite é um POST no id da versão aberta,
 * e só para versão em vigor. Sem sessão, a leitura vem do endpoint público.
 */

// A pista de sessão é função de servidor/cliente do router: no jsdom ela tenta ler o cookie do
// servidor. "Sem sessão" é o padrão dos testes; quem quer logado troca `sessao.logado`.
vi.mock("@/lib/auth-hint", () => ({
  AUTH_HINT_COOKIE: "enois_auth",
  setAuthHint: () => {},
  clearAuthHint: () => {},
  syncAuthHint: () => {},
  readAuthHint: () => false,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options, useSearch: () => ({}) }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

const sessao = { logado: true };
// Quem controla quando cada leitura responde: o caso vazio precisa provar que uma leitura DESLIGADA
// não é tratada como pronta.
const espera = {
  vigentes: null as Promise<unknown> | null,
  minhaSituacao: null as Promise<unknown> | null,
};
// O indicador que a página usa (a pista de sessão + a flag local, sem token), nunca o cache
// da query `["me"]` — ele só existe depois de `/me` responder e não diz se há sessão.
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => sessao.logado }));

const aceitar = vi.fn(async (id: string) => ({
  id: "aceite_1",
  documentoId: id,
  tipo: "DIRETRIZES",
  versao: 2,
  origem: "AceiteExplicito",
  aceitoEm: "2026-11-25T00:00:00Z",
}));

const RESUMO_DIRETRIZES = {
  id: "dl_dir_2",
  tipo: "DIRETRIZES",
  versao: 2,
  titulo: "Diretrizes — versão 2",
  resumo: "Conteúdo sexual e figurinhas da comunidade.",
  exigeAceite: true,
  aprovado: true,
  vigente: true,
  vigenteDesde: "2026-11-25T00:00:00Z",
};

vi.mock("@/lib/documentos", () => ({
  TIPOS_DE_DOCUMENTO: ["DIRETRIZES", "TERMOS_DE_USO"],
  documentosApi: {
    vigentes: vi.fn(async () => espera.vigentes ?? [RESUMO_DIRETRIZES]),
    minhaSituacao: vi.fn(
      async () =>
        espera.minhaSituacao ?? {
          documentos: [
            {
              documento: RESUMO_DIRETRIZES,
              conteudo: "## Zero tolerância\n\nTexto das diretrizes.",
              aceito: false,
            },
          ],
          pendentes: [RESUMO_DIRETRIZES],
        },
    ),
    documento: vi.fn(async () => ({
      documento: RESUMO_DIRETRIZES,
      conteudo: "## Zero tolerância\n\nTexto das diretrizes.",
      aceito: false,
    })),
    historico: vi.fn(async () => [RESUMO_DIRETRIZES]),
    meusAceites: vi.fn(async () => []),
    aceitar,
  },
  documentosAdminApi: { criarRascunho: vi.fn(), publicar: vi.fn() },
}));

const { Route } = await import("./documentos");
const Documentos = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  sessao.logado = true;
  espera.vigentes = null;
  espera.minhaSituacao = null;
  aceitar.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function renderizar() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <EnoisProvider>
          <Documentos />
        </EnoisProvider>
      </QueryClientProvider>,
    ),
  );
  // A primeira busca e o texto aberto chegam em promessas encadeadas.
  for (let i = 0; i < 20 && !host.textContent?.includes("Zero tolerância"); i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

function botao(inicio: string) {
  return Array.from(host.querySelectorAll("button")).find((item) =>
    item.textContent?.trim().startsWith(inicio),
  );
}

describe("Meus documentos", () => {
  it("abre o texto em vigor e a pendência sem aceitar nada sozinho", async () => {
    await renderizar();

    const texto = host.textContent ?? "";
    expect(texto).toContain(texts.documentos.pendenciaTitulo);
    expect(texto).toContain("Zero tolerância");
    expect(texto).toContain(texts.documentos.naoVigente);
    expect(aceitar).not.toHaveBeenCalled();
  });

  it("aceitar manda o id da versão aberta", async () => {
    await renderizar();

    await act(async () => {
      (botao(texts.documentos.aceitar) as HTMLButtonElement).click();
    });

    expect(aceitar).toHaveBeenCalledTimes(1);
    expect(aceitar).toHaveBeenCalledWith("dl_dir_2");
  });

  it("sem sessão a página é só leitura", async () => {
    sessao.logado = false;
    await renderizar();

    expect(host.textContent).toContain(texts.documentos.pendenciaIr);
    expect(botao(texts.documentos.aceitar)).toBeUndefined();
  });

  it("sem sessão, a tela fica em carregamento até a leitura do visitante responder", async () => {
    sessao.logado = false;
    let liberar: () => void = () => {};
    espera.vigentes = new Promise((resolve) => {
      liberar = () => resolve([]);
    });
    await renderizar();

    expect(host.textContent).toContain(texts.documentos.loading);
    expect(host.textContent).not.toContain(texts.documentos.pendenciaTitulo);

    await act(async () => {
      liberar();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(host.textContent).toContain(texts.documentos.pendenciaIr);
  });

  it("sem sessão, usuário que ficou no cache de /me não vira visitante logado", async () => {
    sessao.logado = false;
    client.setQueryData(["me"], { id: "u_1", nome: "Alguém" });
    await renderizar();

    expect(host.textContent).toContain(texts.documentos.pendenciaIr);
    expect(botao(texts.documentos.aceitar)).toBeUndefined();
  });
});
