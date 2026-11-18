import type { AutoplayEnvironment } from "@/types/lib/feed/autoplay-environment";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ENTER_VISIBLE,
  STAY_VISIBLE,
  SWITCH_MARGIN,
  createVideoAutoplay,
  scoreVideoRect,
} from "./video-autoplay";

const VH = 800;

/** Vídeo falso: estado de reprodução, retângulo configurável, escritas em currentTime contadas. */
function fakeVideo(rect = { top: 250, height: 300 }) {
  const listeners = new Map<string, Set<() => void>>();
  let time = 0;
  const video = {
    paused: true,
    muted: false,
    rect,
    playCalls: 0,
    pauseCalls: 0,
    loadCalls: 0,
    timeWrites: 0,
    rejectWith: null as { name: string } | null,
    /** Como no navegador: `paused` muda na chamada, mas os eventos só chegam em `flushEvents()`. */
    asyncEvents: false,
    eventQueue: [] as (() => void)[],
    emit(type: string) {
      [...(listeners.get(type) ?? [])].forEach((listener) => listener());
    },
    fire(type: string, after?: () => void) {
      if (!video.asyncEvents) {
        video.emit(type);
        after?.();
      } else {
        video.eventQueue.push(() => {
          video.emit(type);
          after?.();
        });
      }
    },
    flushEvents() {
      while (video.eventQueue.length) video.eventQueue.shift()!();
    },
    play() {
      video.playCalls++;
      if (video.rejectWith) return Promise.reject(video.rejectWith);
      video.paused = false;
      // A Promise só resolve depois do evento `play`.
      return new Promise<void>((resolve) => video.fire("play", resolve));
    },
    pause() {
      video.pauseCalls++;
      video.paused = true;
      video.fire("pause");
    },
    /** A pessoa aperta play / pause nos controles: eventos sem passar pelo coordenador. */
    userPlay() {
      video.paused = false;
      video.fire("play");
    },
    userPause() {
      video.paused = true;
      video.fire("pause");
    },
    load() {
      video.loadCalls++;
    },
    getBoundingClientRect() {
      return video.rect;
    },
    addEventListener(type: string, listener: () => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: () => void) {
      listeners.get(type)?.delete(listener);
    },
    listenerCount() {
      return [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
    },
    get currentTime() {
      return time;
    },
    set currentTime(value: number) {
      video.timeWrites++;
      time = value;
    },
  };
  return video;
}

/** Ambiente falso: IO com gatilho manual, rAF em fila, aba oculta mutável e inscrições espiadas. */
function fakeEnv({ withObserver = true } = {}) {
  let hidden = false;
  let onIo: (changes: { target: unknown; isIntersecting: boolean }[]) => void = () => {};
  let onVisibility: () => void = () => {};
  let onViewport: () => void = () => {};
  const queue: (() => void)[] = [];
  const io = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  const unsubVisibility = vi.fn();
  const unsubViewport = vi.fn();
  const env: AutoplayEnvironment = {
    createObserver: withObserver
      ? (callback) => {
          onIo = callback;
          return io;
        }
      : null,
    viewportHeight: () => VH,
    isHidden: () => hidden,
    onVisibilityChange: (callback) => {
      onVisibility = callback;
      return unsubVisibility;
    },
    onViewportChange: (callback) => {
      onViewport = callback;
      return unsubViewport;
    },
    schedule: (callback) => {
      queue.push(callback);
    },
  };
  return {
    env,
    io,
    unsubVisibility,
    unsubViewport,
    flush() {
      while (queue.length) queue.shift()!();
    },
    intersect(video: object, isIntersecting: boolean) {
      onIo([{ target: video, isIntersecting }]);
    },
    scroll() {
      onViewport();
    },
    setHidden(value: boolean) {
      hidden = value;
      onVisibility();
    },
  };
}

/** Registra os vídeos, marca todos como perto da tela e deixa o coordenador decidir. */
function mount(...videos: ReturnType<typeof fakeVideo>[]) {
  const harness = fakeEnv();
  const autoplay = createVideoAutoplay(harness.env);
  const cleanups = videos.map((video) => autoplay.register(video));
  videos.forEach((video) => harness.intersect(video, true));
  harness.flush();
  return { ...harness, autoplay, cleanups };
}

/** Deixa as Promises de play() assentarem. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("scoreVideoRect", () => {
  it("vídeo inteiro no centro da tela tem visibilidade e score próximos de 1", () => {
    const { visible, score } = scoreVideoRect({ top: 250, height: 300 }, VH);
    expect(visible).toBeCloseTo(1);
    expect(score).toBeCloseTo(1);
  });

  it("vídeo mais alto que a tela usa a fração da viewport", () => {
    expect(scoreVideoRect({ top: -100, height: 2000 }, VH).visible).toBe(1);
    expect(scoreVideoRect({ top: -150, height: 300 }, VH).visible).toBeCloseTo(0.5);
  });

  it("fora da tela ou sem altura não é visível", () => {
    expect(scoreVideoRect({ top: 900, height: 300 }, VH).visible).toBe(0);
    expect(scoreVideoRect({ top: 100, height: 0 }, VH).visible).toBe(0);
  });

  it("limiares do plano", () => {
    expect([ENTER_VISIBLE, STAY_VISIBLE, SWITCH_MARGIN]).toEqual([0.6, 0.3, 0.15]);
  });
});

describe("autoplay: início e um vídeo por vez", () => {
  it("T1: vídeo visível inicia automaticamente, sem som", () => {
    const a = fakeVideo();
    mount(a);
    expect(a.playCalls).toBe(1);
    expect(a.paused).toBe(false);
    expect(a.muted).toBe(true);
  });

  it("T1: vídeo longe da tela (não elegível) não toca", () => {
    const a = fakeVideo({ top: 700, height: 300 });
    mount(a);
    expect(a.playCalls).toBe(0);
  });

  it("T2: dois vídeos visíveis não tocam ao mesmo tempo", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 400, height: 300 });
    mount(a, b);
    expect(a.playCalls + b.playCalls).toBe(1);
    expect([a, b].filter((v) => !v.paused)).toHaveLength(1);
  });

  it("T2: play manual de B pausa A", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 400, height: 300 });
    const { scroll, flush } = mount(a, b);
    const [playing, other] = a.paused ? [b, a] : [a, b];
    other.userPlay();
    expect(playing.paused).toBe(true);
    expect(other.paused).toBe(false);
    scroll();
    flush();
    expect([a, b].filter((v) => !v.paused)).toHaveLength(1);
  });
});

describe("autoplay: seleção ao rolar", () => {
  it("T3: ao rolar até B central, A pausa e B toca", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 450, height: 300 });
    const { scroll, flush } = mount(a, b);
    expect(a.paused).toBe(false);
    expect(b.paused).toBe(true);

    a.rect = { top: -100, height: 300 };
    b.rect = { top: 250, height: 300 };
    scroll();
    flush();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);
  });

  it("T3: vantagem menor que a margem não troca o ativo", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 450, height: 300 });
    const { scroll, flush } = mount(a, b);
    expect(a.paused).toBe(false);

    b.rect = { top: 350, height: 300 };
    scroll();
    flush();
    expect(a.paused).toBe(false);
    expect(b.playCalls).toBe(0);
  });

  it("T3: empate de score escolhe o menor top, não a ordem de registro", () => {
    const low = fakeVideo({ top: 400, height: 300 });
    const high = fakeVideo({ top: 100, height: 300 });
    mount(low, high);
    expect(high.paused).toBe(false);
    expect(low.paused).toBe(true);
  });

  it("T3: scroll e IO no mesmo frame viram uma só reavaliação", () => {
    const a = fakeVideo();
    const { scroll, intersect, flush } = mount(a);
    scroll();
    scroll();
    intersect(a, true);
    flush();
    expect(a.playCalls).toBe(1);
  });
});

describe("autoplay: sair e voltar para a tela", () => {
  it("T4/T5: sair pausa, voltar continua tocando sem mexer em currentTime nem recarregar", () => {
    const a = fakeVideo();
    const { intersect, flush } = mount(a);
    expect(a.paused).toBe(false);

    intersect(a, false);
    flush();
    expect(a.paused).toBe(true);

    intersect(a, true);
    flush();
    expect(a.paused).toBe(false);
    expect(a.playCalls).toBe(2);
    expect(a.timeWrites).toBe(0);
    expect(a.loadCalls).toBe(0);
  });
});

describe("autoplay: interação manual", () => {
  it("T6: pausa manual não é desfeita por scroll nem por IO enquanto perto", () => {
    const a = fakeVideo();
    const { scroll, intersect, flush } = mount(a);
    a.userPause();

    scroll();
    intersect(a, true);
    flush();
    expect(a.playCalls).toBe(1);
    expect(a.paused).toBe(true);
  });

  it("T6: depois de sair e voltar à tela o autoplay retoma", () => {
    const a = fakeVideo();
    const { intersect, flush } = mount(a);
    a.userPause();

    intersect(a, false);
    flush();
    intersect(a, true);
    flush();
    expect(a.playCalls).toBe(2);
    expect(a.paused).toBe(false);
  });

  it("T6: play manual de B segura o autoplay de A enquanto B toca", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 450, height: 300 });
    const { scroll, flush } = mount(a, b);
    expect(a.paused).toBe(false);

    b.userPlay();
    expect(a.paused).toBe(true);
    scroll();
    flush();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);

    // B pausado pela pessoa: o autoplay volta a valer para A.
    b.userPause();
    flush();
    expect(a.paused).toBe(false);
  });

  it("T6: som ligado em vídeo tocando também o torna dono da reprodução", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 450, height: 300 });
    const { scroll, flush } = mount(a, b);
    a.muted = false;
    a.emit("volumechange");

    b.rect = { top: 250, height: 300 };
    a.rect = { top: -100, height: 300 };
    scroll();
    flush();
    expect(a.paused).toBe(false);
    expect(b.paused).toBe(true);
  });

  it("T6: vídeo do dono com menos do que o piso de permanência na tela pausa (o som não segue o scroll)", () => {
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 450, height: 300 });
    const { scroll, flush } = mount(a, b);
    a.muted = false;
    a.emit("volumechange");

    // Ainda perto (o IntersectionObserver segue "true"), mas só um pedaço na viewport:
    // com o som assumido, a reprodução não pode continuar fora de vista.
    a.rect = { top: -240, height: 300 };
    scroll();
    flush();
    expect(a.paused).toBe(true);

    // De volta à vista: quem assume é o autoplay (mudo), como depois de qualquer saída de cena.
    a.rect = { top: 250, height: 300 };
    scroll();
    flush();
    expect(a.paused).toBe(false);
    expect(a.muted).toBe(true);
    expect(b.paused).toBe(true);
  });

  it("T6: vídeo que terminou não recomeça sozinho", () => {
    const a = fakeVideo();
    const { scroll, flush } = mount(a);
    a.paused = true;
    a.emit("ended");
    scroll();
    flush();
    expect(a.playCalls).toBe(1);
  });
});

describe("autoplay: aba oculta", () => {
  it("T7: aba oculta pausa na hora, não toca ao rolar e retoma ao voltar", () => {
    const a = fakeVideo();
    const { setHidden, scroll, flush } = mount(a);
    expect(a.paused).toBe(false);

    setHidden(true);
    expect(a.paused).toBe(true);

    scroll();
    flush();
    expect(a.playCalls).toBe(1);

    setHidden(false);
    expect(a.paused).toBe(false);
    expect(a.playCalls).toBe(2);
  });
});

describe("autoplay: rejeição de play()", () => {
  it("T8: NotAllowedError não gera rejeição não tratada nem nova tentativa", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const a = fakeVideo();
      a.rejectWith = { name: "NotAllowedError" };
      const { scroll, intersect, flush } = mount(a);
      await settle();
      scroll();
      intersect(a, true);
      flush();
      await settle();
      expect(a.playCalls).toBe(1);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("T8: play manual limpa o bloqueio", async () => {
    const a = fakeVideo();
    a.rejectWith = { name: "NotAllowedError" };
    const { intersect, flush } = mount(a);
    await settle();

    a.rejectWith = null;
    a.userPlay();
    a.userPause();
    intersect(a, false);
    flush();
    intersect(a, true);
    flush();
    expect(a.playCalls).toBe(2);
    expect(a.paused).toBe(false);
  });

  it("T8: AbortError não bloqueia o vídeo", async () => {
    const a = fakeVideo();
    a.rejectWith = { name: "AbortError" };
    const { scroll, flush } = mount(a);
    await settle();
    scroll();
    flush();
    expect(a.playCalls).toBe(2);
  });
});

describe("autoplay: eventos assíncronos (como no navegador)", () => {
  it("pause()+play() do coordenador antes dos eventos não vira pausa nem play manual", () => {
    const a = fakeVideo({ top: 250, height: 300 });
    const b = fakeVideo({ top: 560, height: 300 });
    a.asyncEvents = true;
    const { setHidden, scroll, flush } = mount(a, b);
    expect(a.paused).toBe(false);
    expect(b.playCalls).toBe(0);

    // Aba oculta logo após o autoplay e de volta, antes de qualquer evento chegar.
    setHidden(true);
    setHidden(false);
    expect(a.playCalls).toBe(2);
    a.flushEvents();

    // Não ficou suppressed: continua ativo e B não toma o lugar.
    scroll();
    flush();
    expect(a.paused).toBe(false);
    expect(b.playCalls).toBe(0);

    // Não virou owner: com B claramente melhor, o autoplay troca de vídeo.
    a.rect = { top: 500, height: 300 };
    b.rect = { top: 250, height: 300 };
    scroll();
    flush();
    a.flushEvents();
    expect(b.paused).toBe(false);
    expect(a.paused).toBe(true);
  });

  it("play()+pause() do coordenador antes do evento play não vira owner", () => {
    const a = fakeVideo({ top: 250, height: 300 });
    const b = fakeVideo({ top: 900, height: 300 });
    a.asyncEvents = true;
    const { setHidden, scroll, flush } = mount(a, b);
    setHidden(true);
    expect(a.paused).toBe(true);
    a.flushEvents();

    // A saiu de cena e B ficou elegível: se A tivesse virado owner, B não tocaria.
    setHidden(false);
    a.flushEvents();
    a.rect = { top: 900, height: 300 };
    b.rect = { top: 250, height: 300 };
    scroll();
    flush();
    a.flushEvents();
    expect(b.paused).toBe(false);
    expect(a.paused).toBe(true);
  });

  it("evento play atrasado de um vídeo já trocado não pausa o novo ativo", () => {
    const a = fakeVideo({ top: 250, height: 300 });
    const b = fakeVideo({ top: 900, height: 300 });
    a.asyncEvents = true;
    const { scroll, flush } = mount(a, b);
    expect(a.paused).toBe(false);

    // Troca para B antes de o evento `play` de A chegar.
    a.rect = { top: 900, height: 300 };
    b.rect = { top: 250, height: 300 };
    scroll();
    flush();
    expect(b.paused).toBe(false);

    a.flushEvents();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);
    expect(b.pauseCalls).toBe(0);
  });

  it("NotAllowedError assíncrono devolve a pendência: play manual seguinte é do usuário", async () => {
    const a = fakeVideo({ top: 250, height: 300 });
    const b = fakeVideo({ top: 560, height: 300 });
    a.asyncEvents = true;
    a.rejectWith = { name: "NotAllowedError" };
    const { scroll, flush } = mount(a, b);
    await settle();
    flush();
    expect(b.playCalls).toBe(1);

    a.rejectWith = null;
    a.userPlay();
    a.flushEvents();
    expect(b.paused).toBe(true);

    // A é owner: o autoplay não devolve o lugar a B.
    scroll();
    flush();
    expect(a.paused).toBe(false);
    expect(b.playCalls).toBe(1);
  });
});

describe("autoplay: ciclo de vida", () => {
  it("T9: cleanup remove listeners e observação; o último desfaz os recursos globais", () => {
    const a = fakeVideo();
    const b = fakeVideo({ top: 700, height: 300 });
    const { autoplay, cleanups, io, unsubVisibility, unsubViewport } = mount(a, b);
    expect(autoplay.size()).toBe(2);
    expect(a.listenerCount()).toBe(4);

    cleanups[0]();
    expect(a.listenerCount()).toBe(0);
    expect(io.unobserve).toHaveBeenCalledWith(a);
    expect(io.disconnect).not.toHaveBeenCalled();
    expect(autoplay.size()).toBe(1);

    cleanups[1]();
    expect(b.listenerCount()).toBe(0);
    expect(io.disconnect).toHaveBeenCalledTimes(1);
    expect(unsubVisibility).toHaveBeenCalledTimes(1);
    expect(unsubViewport).toHaveBeenCalledTimes(1);
    expect(autoplay.size()).toBe(0);
  });

  it("T9: rejeição que chega depois da desmontagem é ignorada", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const a = fakeVideo();
      a.rejectWith = { name: "NotAllowedError" };
      const { cleanups, autoplay } = mount(a);
      cleanups[0]();
      await settle();
      expect(autoplay.size()).toBe(0);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("T9: registro duplo (StrictMode) mantém um só registro", () => {
    const harness = fakeEnv();
    const autoplay = createVideoAutoplay(harness.env);
    const a = fakeVideo();
    const first = autoplay.register(a);
    const second = autoplay.register(a);
    expect(autoplay.size()).toBe(1);
    expect(a.listenerCount()).toBe(4);

    // O cleanup antigo não derruba o registro novo.
    first();
    expect(autoplay.size()).toBe(1);
    expect(a.listenerCount()).toBe(4);

    second();
    expect(autoplay.size()).toBe(0);
    expect(a.listenerCount()).toBe(0);
  });

  it("T9: IO sobre vídeo já desregistrado é ignorado", () => {
    const harness = fakeEnv();
    const autoplay = createVideoAutoplay(harness.env);
    const a = fakeVideo();
    const b = fakeVideo();
    const cleanupA = autoplay.register(a);
    autoplay.register(b);
    cleanupA();
    harness.intersect(a, true);
    harness.flush();
    expect(a.playCalls).toBe(0);
  });
});

describe("autoplay: sem IntersectionObserver", () => {
  it("T10: nunca toca sozinho, mas mantém um vídeo por vez", () => {
    const harness = fakeEnv({ withObserver: false });
    const autoplay = createVideoAutoplay(harness.env);
    const a = fakeVideo({ top: 100, height: 300 });
    const b = fakeVideo({ top: 400, height: 300 });
    autoplay.register(a);
    autoplay.register(b);
    harness.scroll();
    harness.flush();
    expect(a.playCalls + b.playCalls).toBe(0);

    a.userPlay();
    b.userPlay();
    expect(a.paused).toBe(true);
    expect(b.paused).toBe(false);
  });
});
