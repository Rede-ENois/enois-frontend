import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { stateLabel } from "./state-label";

describe("stateLabel", () => {
  it("mostra 'chamando' enquanto a chamada ainda não foi atendida", () => {
    expect(stateLabel("INITIATING")).toBe(texts.calls.ringing);
    expect(stateLabel("RINGING")).toBe(texts.calls.ringing);
  });

  it("dá um texto próprio para cada estado de fim de chamada", () => {
    const finais = ["DECLINED", "MISSED", "CANCELLED", "ENDED", "FAILED"] as const;
    const rotulos = finais.map(stateLabel);
    expect(new Set(rotulos).size).toBe(finais.length);
    expect(rotulos.every((r) => typeof r === "string" && r.length > 0)).toBe(true);
  });

  it("separa conectando de chamada em andamento", () => {
    expect(stateLabel("CONNECTING")).toBe(texts.calls.connecting);
    expect(stateLabel("ACTIVE")).toBe(texts.calls.active);
  });
});
