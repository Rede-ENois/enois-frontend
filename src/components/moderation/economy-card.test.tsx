// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import type { MonitoringEconomy } from "@/types/application/monitoring/monitoring-economy";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EconomyCard } from "@/components/moderation/monitoring-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const base: MonitoringEconomy = {
  janelaDias: 30,
  usoEscrow: 0,
  usoP2p: 0,
  retornoCofre: 0,
  emissao: 0,
  circulacao: 1_000_000,
  cofre: 500_000,
  escassez: 1.5,
  indice: 0.95,
  cotacaoAtualMicros: 10_000,
  cotacaoSugeridaMicros: 9_900,
  publicavelAgora: false,
  periodoDecorrido: 0.4,
  proximaAvaliacaoEm: "2026-10-29T03:10:00Z",
};

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

function render(economy: Partial<MonitoringEconomy>) {
  act(() =>
    root.render(
      <EconomyCard economy={{ ...base, ...economy }} pending={false} onRecalculate={() => {}} />,
    ),
  );
}

const button = () => container.querySelector("button");

/**
 * A cotação publica no máximo uma vez por período: clicar fora da janela não muda o mercado, então
 * o botão não pode fingir que muda.
 */
describe("EconomyCard", () => {
  it("desliga o botão fora da janela do período", () => {
    render({ publicavelAgora: false });

    expect(button()?.disabled).toBe(true);
    expect(container.textContent).toContain(texts.coinEconomy.janelaFechada);
  });

  it("libera o botão quando o período fechou", () => {
    render({ publicavelAgora: true });

    expect(button()?.disabled).toBe(false);
    expect(container.textContent).toContain(texts.coinEconomy.janelaAberta);
  });
});
