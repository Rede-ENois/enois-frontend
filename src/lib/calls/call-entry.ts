import type { CallPhase } from "@/types/application/call/call-phase";
import type { CallView } from "@/types/application/call/call-view";

/**
 * Quando a tela pode abrir uma sala sozinha.
 *
 * Regra do produto: só o 1:1 puxa a pessoa (o toque e a entrada chegam sozinhos). O "Tamo junto"
 * é opt-in — nem toca nem abre a tela; ele fica ao vivo na barra do grupo e quem quiser usa
 * "Entrar". Antes, no grupo, cada aviso do servidor reabria a sala que a pessoa tinha acabado
 * de fechar, porque a saída de um participante não encerra a sala: ela continua ACTIVE.
 *
 * Esta decisão mora aqui, fora do componente, para poder ser provada por teste: o provider chama
 * a mesma função nos três pontos que abrem sala sozinha (evento do stream, conferência periódica
 * e retomada ao abrir o app).
 */
export function shouldAutoEnter(call: CallView, phase: CallPhase, left: boolean): boolean {
  if (!wasAnswered(call) && !isJoining(call)) return false;
  if (call.modality !== "DIRECT") return false;
  // Entrando, na sala ou num erro que espera um clique: não abrir outra entrada.
  if (phase !== "idle" && phase !== "ended" && phase !== "incoming" && phase !== "calling") {
    return false;
  }
  // A pessoa saiu de propósito: voltar é o botão "Entrar", um clique explícito.
  return !left;
}

/**
 * Chamada que já está na sala (ou entrando nela) e ainda não terminou. É o único estado em que
 * o servidor pode reabrir a sala sem pedir nada.
 */
function wasAnswered(call: CallView): boolean {
  return call.state === "ACTIVE";
}

function isJoining(call: CallView): boolean {
  return call.state === "CONNECTING";
}
