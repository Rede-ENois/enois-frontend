import type { AutoplayEntry } from "@/types/lib/feed/autoplay-entry";
import type { AutoplayEnvironment } from "@/types/lib/feed/autoplay-environment";
import type { AutoplayVideo } from "@/types/lib/feed/autoplay-video";

import { readEconomicMode } from "@/lib/lite-mode";

/** Fração mínima visível para um vídeo ficar elegível a começar a tocar. */
export const ENTER_VISIBLE = 0.6;
/** Enquanto o vídeo ativo mantiver pelo menos essa fração visível, ele continua tocando. */
export const STAY_VISIBLE = 0.3;
/** Vantagem de score que um concorrente precisa ter para tirar o lugar do ativo (evita vai-e-vem). */
export const SWITCH_MARGIN = 0.15;

const VIDEO_EVENTS = ["play", "pause", "ended", "volumechange"] as const;

/**
 * Mede o retângulo do vídeo contra a viewport: `visible` é a fração à vista (para vídeos mais altos
 * que a tela, conta a fração da viewport ocupada) e `score` mistura visibilidade e proximidade do
 * centro da tela, de 0 a 1.
 */
export function scoreVideoRect(
  rect: { top: number; height: number },
  vh: number,
): { visible: number; score: number } {
  if (vh <= 0) return { visible: 0, score: 0 };
  const bottom = rect.top + rect.height;
  const visibleHeight = Math.max(0, Math.min(bottom, vh) - Math.max(rect.top, 0));
  const visible =
    rect.height > 0 ? Math.min(1, Math.max(visibleHeight / rect.height, visibleHeight / vh)) : 0;
  const centrality = 1 - Math.min(1, Math.abs(rect.top + rect.height / 2 - vh / 2) / (vh / 2));
  return { visible, score: 0.5 * visible + 0.5 * centrality };
}

/**
 * Coordenador de autoplay dos vídeos do feed: só um vídeo toca sozinho por vez (o mais bem
 * posicionado), a pessoa sempre tem prioridade sobre o autoplay e nada mexe em `currentTime`.
 * O ambiente é injetado para a lógica rodar (e ser testada) sem DOM.
 */
export function createVideoAutoplay(env: AutoplayEnvironment) {
  const entries = new Map<AutoplayVideo, AutoplayEntry>();
  let active: AutoplayEntry | null = null;
  let owner: AutoplayEntry | null = null;
  let scheduled = false;
  let nextOrder = 0;
  let observer: ReturnType<NonNullable<AutoplayEnvironment["createObserver"]>> | null = null;
  let unsubscribes: (() => void)[] = [];

  /** Pausa por decisão do coordenador (marca antes, para o evento não ser lido como pausa manual). */
  function pauseP(entry: AutoplayEntry) {
    if (entry.video.paused) return;
    entry.pendingPause++;
    entry.video.pause();
  }

  /** Toca por decisão do coordenador, sempre mudo, tratando a rejeição da Promise. */
  function playP(entry: AutoplayEntry) {
    const { video } = entry;
    if (!video.paused) return;
    video.muted = true;
    entry.pendingPlay++;
    let result: Promise<void>;
    let thrown = false;
    try {
      result = Promise.resolve(video.play());
    } catch (error) {
      // Exceção síncrona: o navegador não dispara `play`.
      thrown = true;
      entry.pendingPlay = Math.max(0, entry.pendingPlay - 1);
      result = Promise.reject(error);
    }
    result.then(
      () => {
        // O evento `play` precede a resolução: o contador já foi consumido pelo handler.
      },
      (error: unknown) => {
        const aborted = (error as { name?: string } | null)?.name === "AbortError";
        // Rejeição que não é AbortError (ex.: NotAllowedError) não dispara `play`: devolve a pendência.
        // (Exceção síncrona já devolveu acima.)
        if (!aborted && !thrown) entry.pendingPlay = Math.max(0, entry.pendingPlay - 1);
        // Já desmontado: nada a atualizar.
        if (entries.get(video) !== entry) return;
        // Play interrompido por um pause nosso: não é bloqueio, o vídeo só não chegou a tocar.
        if (aborted) return;
        // Política do navegador negou: não insiste até a pessoa dar play.
        entry.blocked = true;
        if (active === entry) active = null;
        request();
      },
    );
  }

  /** Garante um vídeo por vez: pausa qualquer outro que esteja tocando. */
  function pauseOthers(except: AutoplayEntry) {
    for (const other of entries.values()) {
      if (other === except || other.video.paused) continue;
      pauseP(other);
      if (owner === other) owner = null;
      if (active === other) active = null;
    }
  }

  /** A pessoa assumiu este vídeo (play manual ou som ligado): o autoplay sai da frente. */
  function becomeOwner(entry: AutoplayEntry) {
    pauseOthers(entry);
    if (active && active !== entry) pauseP(active);
    active = null;
    entry.suppressed = false;
    entry.blocked = false;
    owner = entry;
  }

  function reevaluate() {
    if (!observer) return;
    if (owner) {
      if (!owner.near) {
        pauseP(owner);
        owner = null;
      } else {
        return;
      }
    }
    // Aba oculta: pausa o autoplay (a pessoa não está olhando). Retoma no visibilitychange.
    if (env.isHidden()) {
      if (active) pauseP(active);
      active = null;
      return;
    }

    const vh = env.viewportHeight();
    const candidates = [...entries.values()]
      .filter((e) => e.near && !e.suppressed && !e.blocked)
      .map((e) => {
        const rect = e.video.getBoundingClientRect();
        return { e, top: rect.top, ...scoreVideoRect(rect, vh) };
      });

    const current = candidates.find((c) => c.e === active);
    const best = candidates
      .filter((c) => c.visible >= ENTER_VISIBLE)
      .sort((a, b) => b.score - a.score || a.top - b.top || a.e.order - b.e.order)[0];

    let next: AutoplayEntry | null;
    if (current && current.visible >= STAY_VISIBLE) {
      // O ativo só perde o lugar para um concorrente claramente melhor (evita alternar no scroll).
      next =
        best && best.e !== active && best.score >= current.score + SWITCH_MARGIN ? best.e : active;
    } else {
      next = best?.e ?? null;
    }

    if (active && active !== next) pauseP(active);
    active = next;
    if (next) playP(next);
  }

  /** Agrupa gatilhos (IO, scroll, resize) em uma única reavaliação por frame. */
  function request() {
    if (scheduled) return;
    scheduled = true;
    env.schedule(() => {
      scheduled = false;
      reevaluate();
    });
  }

  function onIntersection(changes: { target: unknown; isIntersecting: boolean }[]) {
    for (const change of changes) {
      const entry = entries.get(change.target as AutoplayVideo);
      if (!entry) continue;
      entry.near = change.isIntersecting;
      // Saiu da tela: a pausa manual acaba aqui, voltar ao card libera o autoplay de novo.
      if (!entry.near) entry.suppressed = false;
    }
    request();
  }

  function startResources() {
    observer = env.createObserver ? env.createObserver(onIntersection) : null;
    unsubscribes = [env.onVisibilityChange(reevaluate), env.onViewportChange(request)];
  }

  function stopResources() {
    observer?.disconnect();
    observer = null;
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    unsubscribes = [];
  }

  function register(video: AutoplayVideo): () => void {
    // Registro duplo (StrictMode): desfaz o anterior antes de criar o novo.
    entries.get(video)?.cleanup();
    if (entries.size === 0) startResources();

    const entry: AutoplayEntry = {
      video,
      order: nextOrder++,
      near: false,
      pendingPlay: 0,
      pendingPause: 0,
      suppressed: false,
      blocked: false,
      cleanup: () => {},
    };

    const handlers = {
      play: () => {
        if (entry.pendingPlay > 0) {
          entry.pendingPlay--;
          // Evento atrasado de um play que já desfizemos: o vídeo está parado de novo, então não
          // pode derrubar quem passou a tocar no lugar dele.
          if (!video.paused) pauseOthers(entry);
        } else {
          becomeOwner(entry);
        }
      },
      pause: () => {
        if (entry.pendingPause > 0) {
          entry.pendingPause--;
          return;
        }
        // Pausa da pessoa (ou do navegador): respeita até o card sair da tela.
        entry.suppressed = true;
        if (owner === entry) owner = null;
        if (active === entry) active = null;
        request();
      },
      ended: () => {
        entry.suppressed = true;
        if (owner === entry) owner = null;
        if (active === entry) active = null;
        request();
      },
      volumechange: () => {
        if (!video.muted && !video.paused) becomeOwner(entry);
      },
    };

    entry.cleanup = () => {
      if (entries.get(video) !== entry) return;
      entries.delete(video);
      for (const type of VIDEO_EVENTS) video.removeEventListener(type, handlers[type]);
      observer?.unobserve(video);
      if (active === entry) active = null;
      if (owner === entry) owner = null;
      if (entries.size === 0) stopResources();
      else request();
    };

    entries.set(video, entry);
    for (const type of VIDEO_EVENTS) video.addEventListener(type, handlers[type]);
    observer?.observe(video);
    request();
    return entry.cleanup;
  }

  return { register, size: () => entries.size };
}

/** Ambiente real do navegador; só é montado sob demanda, nunca no carregamento do módulo. */
function browserEnvironment(): AutoplayEnvironment {
  return {
    createObserver:
      typeof IntersectionObserver === "undefined"
        ? null
        : (onChange) => {
            const io = new IntersectionObserver(
              (observed) =>
                onChange(
                  observed.map((o) => ({ target: o.target, isIntersecting: o.isIntersecting })),
                ),
              { threshold: [0, 0.25, 0.5, 0.75, 1] },
            );
            return {
              observe: (video) => io.observe(video as unknown as Element),
              unobserve: (video) => io.unobserve(video as unknown as Element),
              disconnect: () => io.disconnect(),
            };
          },
    viewportHeight: () => window.innerHeight,
    isHidden: () => document.visibilityState === "hidden",
    onVisibilityChange: (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    onViewportChange: (callback) => {
      document.addEventListener("scroll", callback, { capture: true, passive: true });
      window.addEventListener("resize", callback);
      return () => {
        document.removeEventListener("scroll", callback, { capture: true });
        window.removeEventListener("resize", callback);
      };
    },
    schedule: (callback) => {
      requestAnimationFrame(callback);
    },
  };
}

let shared: ReturnType<typeof createVideoAutoplay> | undefined;

/**
 * Ref callback (React 19) para o `<video>`: registra no coordenador único e devolve o cleanup.
 *
 * Em modo econômico (lite ou BATATA) não registra nada: vídeo que toca sozinho é justamente o
 * "acontecendo sozinho" que o aparelho fraco não aguenta — a pessoa aperta play quando quiser.
 */
export function autoplayVideoRef(el: HTMLVideoElement | null) {
  if (!el || readEconomicMode()) return;
  shared ??= createVideoAutoplay(browserEnvironment());
  return shared.register(el);
}
