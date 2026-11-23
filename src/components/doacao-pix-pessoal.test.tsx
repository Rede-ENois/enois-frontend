// @vitest-environment jsdom
//
// A corrida da #1119: o usuário escolhe R$ 5, o pedido está em voo, ele troca para R$ 10 e o
// servidor responde o de R$ 5. O servidor aposenta a doação anterior a cada abertura, então a
// resposta de R$ 5 vira uma doação recusada — desenhar o QR dela mostraria um código que não paga
// o que a tela diz.
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DoacaoPixPessoal } from "./doacao-pix-pessoal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  desenhar: vi.fn(),
  mine: vi.fn(),
  current: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  doacoesApi: { mine: mocks.mine, open: mocks.open, current: mocks.current, confirm: vi.fn() },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "u1" } }) }));
vi.mock("qrcode", () => ({ default: { toDataURL: mocks.desenhar } }));

/** O card do DS vira um espião: o que está em teste é o que o container entrega a ele. */
const estado = { props: null as null | Record<string, unknown> };
vi.mock("@rede-enois/design-system/domain", () => ({
  DoacaoPessoalCard: (props: Record<string, unknown>) => {
    estado.props = props;
    return <div data-qr={String(props.qrCodeDataUrl ?? "")} />;
  },
}));

let container: HTMLDivElement;
let raiz: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  raiz = createRoot(container);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mocks.desenhar.mockReset();
  mocks.mine.mockReset();
  mocks.mine.mockResolvedValue(null);
  mocks.current.mockReset();
  mocks.current.mockRejectedValue(new Error("sem doacao aberta"));
  mocks.open.mockReset();
  mocks.desenhar.mockResolvedValue("data:image/png;base64,QR");
  estado.props = null;
});

afterEach(() => {
  act(() => raiz.unmount());
  container.remove();
});

function renderizar() {
  return act(async () => {
    raiz.render(
      <QueryClientProvider client={queryClient}>
        <DoacaoPixPessoal />
      </QueryClientProvider>,
    );
  });
}

describe("DoacaoPixPessoal", () => {
  it("descarta a resposta de um valor que o usuário já trocou", async () => {
    let responder:
      ((valor: { id: string; amountCents: number; pixCopyAndPaste: string }) => void) | null = null;
    mocks.open.mockImplementation(
      () =>
        new Promise((resolve) => {
          responder = resolve;
        }),
    );
    await renderizar();

    // Escolhe R$ 5 e abre: o pedido fica em voo.
    await act(async () => {
      (estado.props?.onValorChange as (c: number) => void)(500);
    });
    await act(async () => {
      (estado.props?.onAbrir as () => void)();
      // Deixa a mutation partir sem esperar a resposta.
      await Promise.resolve();
    });

    // Troca para R$ 10 antes da resposta.
    await act(async () => {
      (estado.props?.onValorChange as (c: number) => void)(1000);
    });

    // Agora chega o de R$ 5.
    await act(async () => {
      responder?.({ id: "d5", amountCents: 500, pixCopyAndPaste: "00020126..." });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.desenhar).not.toHaveBeenCalled();
    expect(estado.props?.qrCodeDataUrl).toBeNull();
  });

  it("desenha o QR do valor que continua escolhido", async () => {
    mocks.open.mockResolvedValue({ id: "d10", amountCents: 1000, pixCopyAndPaste: "00020127..." });
    await renderizar();

    await act(async () => {
      (estado.props?.onValorChange as (c: number) => void)(1000);
    });
    await act(async () => {
      (estado.props?.onAbrir as () => void)();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.desenhar).toHaveBeenCalledWith(
      "00020127...",
      expect.objectContaining({ color: { dark: "black", light: "white" } }),
    );
  });

  it("retoma a doação aberta que ainda espera pagamento", async () => {
    mocks.current.mockResolvedValue({ id: "d3", amountCents: 300, pixCopyAndPaste: "00020128..." });
    await renderizar();

    // Deixa a consulta assentar e o efeito do QR rodar na renderização seguinte.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await renderizar();
    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.desenhar).toHaveBeenCalledWith("00020128...", expect.anything());
    expect(estado.props?.codigo).toEqual({
      id: "d3",
      amountCents: 300,
      pixCopyAndPaste: "00020128...",
    });
  });

  it("open que falha depois de um sucesso não deixa QR/código da doação anterior na tela", async () => {
    // Primeiro open dá certo (R$ 5); uma segunda abertura do MESMO valor falha. Sem trocar o
    // valor, não há reset — o `abrir.data` de R$ 5 e o QR dele continuam na tela se a falha não
    // os limpar, e o servidor já aposentou a doação de R$ 5 ao tentar abrir a nova.
    mocks.open
      .mockResolvedValueOnce({ id: "d5", amountCents: 500, pixCopyAndPaste: "00020125..." })
      .mockRejectedValueOnce(new Error("servidor indisponível"));
    await renderizar();

    await act(async () => {
      (estado.props?.onValorChange as (c: number) => void)(500);
    });
    await act(async () => {
      (estado.props?.onAbrir as () => void)();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    // O QR de R$ 5 está na tela.
    expect(estado.props?.codigo).not.toBeNull();
    expect(estado.props?.qrCodeDataUrl).not.toBeNull();

    // Abre de novo, mesmo valor: agora falha, sem `onValorChange` para resetar.
    await act(async () => {
      (estado.props?.onAbrir as () => void)();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // A doação de R$ 5 foi aposentada ao tentar abrir a nova: a tela não pode mostrar o
    // QR/código antigos com a faixa de erro em cima.
    expect(estado.props?.erro).toBeTruthy();
    expect(estado.props?.codigo).toBeNull();
    expect(estado.props?.qrCodeDataUrl).toBeNull();
  });
});
