/**
 * Toque da chamada recebida, sintetizado no navegador (Web Audio).
 *
 * Não usamos um áudio de banco público: os toques "livres" que existem por aí costumam ser
 * gravações de marca (a mesma coisa que a licença CC0 do repositório não cobre). Um par de tons
 * gerados aqui não tem dono, não pesa no bundle e não depende de arquivo. O tom é derivado do ID
 * da chamada: a mesma chamada toca sempre o mesmo par de notas, e chamadas diferentes soam
 * diferentes — sem estado e sem aleatoriedade.
 *
 * Só toca em chamada 1:1 e só depois de um gesto do usuário (o navegador bloqueia áudio sem
 * interação). Em modo lite/BATATA — e quando a pessoa desliga os avisos — fica em silêncio.
 */
import type { RingtoneOptions } from "@/types/application/call/ringtone-options";

const RING_INTERVAL_MS = 3000;

/**
 * Base do primeiro tom, derivada do ID da chamada (FNV-1a): cada chamada soa sempre igual a si
 * mesma e diferente das outras, sem estado e sem aleatoriedade. A segunda base é a primeira
 * descendo uma quinta, para não soar estridente.
 */
function baseTone(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return 500 + (hash % 350);
}

export function startRingtone({ enabled, callId = "" }: RingtoneOptions): () => void {
  if (!enabled || typeof window === "undefined") return () => {};
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return () => {};

  let context: AudioContext;
  try {
    context = new AudioContextClass();
  } catch {
    return () => {};
  }

  const base = baseTone(callId);

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Dois tons curtos, como um telefone tocando, sem estridência. */
  const chime = (offset: number, frequency: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + offset + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + 0.4);
  };

  const ring = () => {
    if (stopped) return;
    // Um AudioContext suspenso (aba em segundo plano, sem gesto) não toca: nesse caso a
    // notificação do sistema é o aviso, e a tela continua mostrando "chamando".
    void context.resume().catch(() => {});
    chime(0, base);
    chime(0.45, base * 0.75);
    timer = setTimeout(ring, RING_INTERVAL_MS);
  };

  ring();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    void context.close().catch(() => {});
  };
}
