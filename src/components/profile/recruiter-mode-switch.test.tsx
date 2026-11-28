// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RecruiterModeSwitch } from "./recruiter-mode-switch";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ me: vi.fn(), update: vi.fn(), toast: vi.fn() }));

vi.mock("@/lib/api", () => ({ profileApi: { me: mocks.me, update: mocks.update } }));
vi.mock("@/lib/session", () => ({ hasSessionFlag: () => true }));
vi.mock("@rede-enois/design-system/ui", () => ({ useToast: () => ({ toast: mocks.toast }) }));

const conta = { id: "user-1", username: "pessoa", name: "Pessoa", isRecruiter: false } as Profile;

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

/** Monta e espera `/me` responder: é a resposta que decide o estado do interruptor. */
async function montar() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <RecruiterModeSwitch />
      </QueryClientProvider>,
    );
  });
  const esperar = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  const fim = performance.now() + 2_000;
  while (client.getQueryState(["me"])?.status !== "success" && performance.now() < fim) {
    await esperar();
  }
  // A consulta avisa os componentes no tick seguinte: só então a tela tem a resposta.
  await esperar();
}

function interruptor() {
  return document.querySelector<HTMLButtonElement>('[role="switch"]');
}

async function alternar() {
  await act(async () => {
    interruptor()?.click();
  });
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.me.mockReset().mockResolvedValue(conta);
  mocks.update.mockReset().mockResolvedValue(conta);
  mocks.toast.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("Interruptor do modo recrutador", () => {
  it("liga mandando só a marca, sem arrastar o resto do perfil junto", async () => {
    await montar();
    expect(interruptor()?.getAttribute("aria-checked")).toBe("false");

    await alternar();

    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update.mock.calls[0]?.[0]).toEqual({ isRecruiter: true });
    expect(mocks.toast).toHaveBeenCalledWith(texts.profile.recruiterMode.on, "success");
  });

  it("quem já é recrutador desliga", async () => {
    mocks.me.mockResolvedValue({ ...conta, isRecruiter: true });
    await montar();
    expect(interruptor()?.getAttribute("aria-checked")).toBe("true");

    await alternar();

    expect(mocks.update.mock.calls[0]?.[0]).toEqual({ isRecruiter: false });
    expect(mocks.toast).toHaveBeenCalledWith(texts.profile.recruiterMode.off, "success");
  });

  it("falha da API vira aviso e não finge que mudou", async () => {
    mocks.update.mockRejectedValue(new Error("offline"));
    await montar();

    await alternar();

    expect(mocks.toast).toHaveBeenCalledWith(texts.profile.recruiterMode.error, "error");
    expect(interruptor()?.getAttribute("aria-checked")).toBe("false");
  });

  it("sem a resposta de /me o interruptor não dá para clicar", async () => {
    mocks.me.mockReturnValue(new Promise(() => undefined));
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <RecruiterModeSwitch />
        </QueryClientProvider>,
      );
    });

    expect(interruptor()?.disabled).toBe(true);
  });
});
