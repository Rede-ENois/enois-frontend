import { BATATA_STORAGE_KEY, readDeviceFlag, writeDeviceFlag } from "./device-flags";

/**
 * Modo BATATA: a interface da web clássica para aparelho com pouca memória, processador fraco ou
 * conexão lenta.
 *
 * A escolha mora na conta (`batataMode` em /me/preferences) e é espelhada no aparelho para valer
 * já no primeiro paint. Quem manda no desenho é o atributo `data-batata` no `<html>` — o
 * LiteModeEffects liga os dois atributos, porque **BATATA implica lite**: os efeitos econômicos
 * (páginas maiores, cache mais folgado, sem autoplay) são os mesmos, e o que o BATATA acrescenta
 * é a camada de estilo que apaga sombra, gradiente, desfoque e canto arredondado.
 */
export function readBatataMode(): boolean {
  return readDeviceFlag(BATATA_STORAGE_KEY);
}

export function writeBatataMode(on: boolean): boolean {
  return writeDeviceFlag(BATATA_STORAGE_KEY, on);
}
