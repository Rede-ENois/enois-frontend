/**
 * Toque da chamada recebida, sintetizado no navegador (Web Audio).
 *
 * Não usamos um áudio de banco público: os toques "livres" que existem por aí costumam ser
 * gravações de marca (a mesma coisa que a licença CC0 do repositório não cobre). Um par de tons
 * gerados aqui não tem dono, não pesa no bundle e não depende de arquivo.
 *
 * Só toca em chamada 1:1 e só depois de um gesto do usuário (o navegador bloqueia áudio sem
 * interação). Em modo lite/BATATA — e quando a pessoa desliga os avisos — fica em silêncio.
 */
import type { RingtoneOptions } from "@/types/application/call/ringtone-options";

const RING_INTERVAL_MS = 3000;

export function startRingtone({ enabled }: RingtoneOptions): () => void {
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
    chime(0, 880);
    chime(0.45, 660);
    timer = setTimeout(ring, RING_INTERVAL_MS);
  };

  ring();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    void context.close().catch(() => {});
  };
}
