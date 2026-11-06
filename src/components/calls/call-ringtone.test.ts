// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startRingtone } from "./call-ringtone";

/** AudioContext de mentira: só conta o que foi criado e fechado. */
function fakeAudioContext(created: number[]) {
  return class {
    currentTime = 0;
    destination = {};
    constructor() {
      created.push(1);
    }
    createOscillator() {
      return {
        type: "sine",
        frequency: { value: 0 },
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

  beforeEach(() => {
    created.length = 0;
    vi.useFakeTimers();
    Object.assign(window, { AudioContext: fakeAudioContext(created) });
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
});
