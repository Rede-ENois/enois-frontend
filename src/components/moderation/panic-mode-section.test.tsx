// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ panicStatus: vi.fn(), setPanic: vi.fn() }));
vi.mock("@/lib/api", () => ({ moderationApi: mocks }));
const { PanicModeSection } = await import("./panic-mode-section");

let host: HTMLDivElement;
let root: Root;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.values(mocks).forEach((mock) => mock.mockReset());
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  host.remove();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <PanicModeSection compact />
      </QueryClientProvider>,
    );
  });
}

function button(label: string): HTMLButtonElement {
  const found = [...host.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!found) throw new Error(`Botão não encontrado: ${label}`);
  return found;
}

describe("modo pânico: estado confirmado pelo servidor", () => {
  it("não recolhe nem permite ativar antes da primeira resposta", async () => {
    let complete: (value: { active: boolean; envLocked: boolean }) => void = () => {
      throw new Error("Consulta não iniciada");
    };
    mocks.panicStatus.mockImplementation(
      () =>
        new Promise<{ active: boolean; envLocked: boolean }>((resolve) => {
          complete = resolve;
        }),
    );
    await render();
    expect(host.querySelector("details")).toBeNull();
    expect(button("Ativar modo pânico").disabled).toBe(true);
    await act(async () => complete({ active: false, envLocked: false }));
    await vi.waitFor(() => expect(host.querySelector("details")).not.toBeNull());
    expect(mocks.setPanic).not.toHaveBeenCalled();
  });

  it("mostra indisponibilidade em vez de inativo e recupera sem alterar o modo", async () => {
    mocks.panicStatus
      .mockRejectedValueOnce(new Error("Falha sintética"))
      .mockResolvedValue({ active: true, envLocked: false });
    await render();
    await vi.waitFor(() =>
      expect(host.querySelector('[role="alert"]')?.textContent).toContain(
        "Não foi possível confirmar",
      ),
    );
    expect(host.querySelector("details")).toBeNull();
    expect(button("Ativar modo pânico").disabled).toBe(true);
    await act(async () => button("Tentar novamente").click());
    await vi.waitFor(() => expect(button("Desativar modo pânico").disabled).toBe(false));
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(mocks.panicStatus).toHaveBeenCalledTimes(2);
    expect(mocks.setPanic).not.toHaveBeenCalled();
  });
});
