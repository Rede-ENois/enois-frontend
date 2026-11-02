// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { readBatataMode, writeBatataMode } from "./batata-mode";
import {
  BATATA_STORAGE_KEY,
  LITE_STORAGE_KEY,
  readDeviceFlag,
  subscribeDeviceFlags,
  writeDeviceFlag,
} from "./device-flags";
import { readEconomicMode, readLiteMode, writeLiteMode } from "./lite-mode";

describe("modo BATATA", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("liga sozinho, sem depender do lite", () => {
    expect(readBatataMode()).toBe(false);

    writeBatataMode(true);

    expect(readBatataMode()).toBe(true);
    // A chave do lite continua intacta: ligar o BATATA não é ligar o lite.
    expect(readLiteMode()).toBe(false);
    expect(readEconomicMode()).toBe(true);
  });

  it("desligar devolve a tela ao que o lite era", () => {
    writeLiteMode(true);
    writeBatataMode(true);
    expect(readEconomicMode()).toBe(true);

    writeBatataMode(false);

    expect(readBatataMode()).toBe(false);
    expect(readLiteMode()).toBe(true);
    expect(readEconomicMode()).toBe(true);
  });

  it("o lite também não reescreve o BATATA", () => {
    writeBatataMode(true);
    writeLiteMode(true);
    writeLiteMode(false);

    expect(readBatataMode()).toBe(true);
    expect(readEconomicMode()).toBe(true);
  });

  it("um aviso só para as duas chaves (mesmo mecanismo de armazenamento)", () => {
    let avisos = 0;
    const stop = subscribeDeviceFlags(() => {
      avisos += 1;
    });

    writeBatataMode(true);
    writeLiteMode(true);
    expect(avisos).toBe(2);

    stop();
    writeDeviceFlag(BATATA_STORAGE_KEY, false);
    expect(avisos).toBe(2);
    expect(readDeviceFlag(LITE_STORAGE_KEY)).toBe(true);
  });
});
