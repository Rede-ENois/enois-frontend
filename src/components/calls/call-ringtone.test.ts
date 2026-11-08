// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startRingtone } from "./call-ringtone";

/** AudioContext de mentira: registra as frequências pedidas aos osciladores. */
function fakeAudioContext(created: number[], frequencies: number[]) {
  return class {
    currentTime = 0;
    destination = {};
    constructor() {
      created.push(1);
    }
    createOscillator() {
      return {
        type: "sine",
        frequency: {
          get value() {
            return 0;
          },
          set value(f: number) {
            frequencies.push(f);
          },
        },
        connect: () => ({ connect: () => {} }),
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => ({ connect: () => {} }),
      };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  };
}

describe("startRingtone", () => {
  const created: number[] = [];
  const frequencies: number[] = [];

  beforeEach(() => {
    created.length = 0;
    frequencies.length = 0;
    vi.useFakeTimers();
    Object.assign(window, { AudioContext: fakeAudioContext(created, frequencies) });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).AudioContext;
  });

  it("pede o toque quando está ligado", () => {
    const stop = startRingtone({ enabled: true });
    expect(created).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    stop();
  });

  it("não cria áudio nenhum quando está desligado (lite/BATATA, avisos off)", () => {
    const stop = startRingtone({ enabled: false });
    expect(created).toHaveLength(0);
    vi.advanceTimersByTime(9000);
    stop();
    expect(created).toHaveLength(0);
  });

  it("parar cancela o próximo toque", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const stop = startRingtone({ enabled: true });
    stop();
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it("a mesma chamada toca sempre as mesmas notas, e chamadas diferentes soam diferentes", () => {
    const stopA = startRingtone({ enabled: true, callId: "call_aaa" });
    expect(frequencies).toHaveLength(2);
    const notasDeA = [...frequencies];
    frequencies.length = 0;
    stopA();

    const stopA2 = startRingtone({ enabled: true, callId: "call_aaa" });
    expect(frequencies).toEqual(notasDeA);
    frequencies.length = 0;
    stopA2();

    const stopB = startRingtone({ enabled: true, callId: "call_bbb" });
    expect(frequencies).not.toEqual(notasDeA);
    stopB();
  });
});
