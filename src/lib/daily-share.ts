import { useEffect, useRef, useState } from "react";

import {
  type DailyShareResult,
  type DailyShareStatus,
  buildDailyShareText,
} from "@rede-enois/design-system/domain";

export const DAILY_SHARE_URL = "https://enois.ia.br/games?categoria=diarios";

/** Quanto tempo o "copiado"/"compartilhado" (ou o erro) fica na tela antes de voltar ao normal. */
const RESET_MS = 3000;

/** "2026-10-30" (data do desafio) vira "30/10", como a pessoa lê. */
export function dailyDateLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

/**
 * Compartilha pelo menu nativo quando existe; senão copia. Fechar o menu nativo (AbortError) não
 * é erro: a pessoa só desistiu, então o estado volta a "idle".
 */
export async function shareDailyText(text: string): Promise<DailyShareStatus> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      return error instanceof DOMException && error.name === "AbortError" ? "idle" : "error";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "error";
  }
}

/** Estado do botão de compartilhar de um jogo diário, com retorno a "idle" depois de alguns segundos. */
export function useDailyShare() {
  const [status, setStatus] = useState<DailyShareStatus>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const share = async (result: DailyShareResult) => {
    window.clearTimeout(timer.current);
    const next = await shareDailyText(buildDailyShareText(result, DAILY_SHARE_URL));
    setStatus(next);
    if (next !== "idle") timer.current = window.setTimeout(() => setStatus("idle"), RESET_MS);
  };

  return { status, share };
}
