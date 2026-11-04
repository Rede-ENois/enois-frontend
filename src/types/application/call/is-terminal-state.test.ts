import { describe, expect, it } from "vitest";

import { isTerminalState } from "./is-terminal-state";

describe("isTerminalState", () => {
  it("só encerra em estado final", () => {
    expect(isTerminalState("INITIATING")).toBe(false);
    expect(isTerminalState("RINGING")).toBe(false);
    expect(isTerminalState("CONNECTING")).toBe(false);
    expect(isTerminalState("ACTIVE")).toBe(false);
    expect(isTerminalState("ENDED")).toBe(true);
    expect(isTerminalState("MISSED")).toBe(true);
    expect(isTerminalState("DECLINED")).toBe(true);
    expect(isTerminalState("CANCELLED")).toBe(true);
    expect(isTerminalState("FAILED")).toBe(true);
  });
});
