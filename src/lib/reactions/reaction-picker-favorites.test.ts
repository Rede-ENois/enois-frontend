// @vitest-environment jsdom
import { useReacoesFavoritasStore } from "@/stores/reacoes-favoritas.store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITAS_PADRAO } from "./favoritas";
import { attachReactionFavorites } from "./reaction-picker-favorites";

const TIPOS = ["LIKE", "HEART_PURPLE", "LOVE", "LAUGH", "ROFL", "SKULL", "WOW", "SAD"];

function montarSeletor(
  expandido: boolean,
  tipos: readonly string[] = TIPOS,
): { popover: HTMLElement; grade: HTMLElement } {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-radix-popper-content-wrapper", "");
  const popover = document.createElement("div");
  const grade = document.createElement("div");
  grade.className = "grid grid-cols-6";
  for (const tipo of tipos) {
    const botao = document.createElement("button");
    const emoji = document.createElement("span");
    emoji.setAttribute("data-reaction-emoji", tipo);
    emoji.textContent = `emoji-${tipo}`;
    botao.append(emoji);
    botao.title = tipo;
    grade.append(botao);
  }
  if (!expandido) {
    const mais = document.createElement("button");
    mais.title = "+";
    grade.append(mais);
  }
  popover.append(grade);
  wrapper.append(popover);
  document.body.append(wrapper);
  return { popover, grade };
}

/** Quem está favorita na grade, na ordem do store (a mesma do `data-filled` no markup). */
function marcadas(grade: HTMLElement): string[] {
  return [...grade.querySelectorAll<HTMLElement>('[data-filled="sim"]')].map(
    (el) => el.getAttribute("data-reaction-emoji") ?? "",
  );
}

/** A ordem em que a grade expandida desenha as reações (o `order` inline e, depois, a do DOM). */
function ordemDaGrade(grade: HTMLElement): string[] {
  return [...grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")]
    .map((el) => ({ tipo: el.getAttribute("data-reaction-emoji") ?? "", order: el.style.order }))
    .sort((a, b) => {
      const oa = a.order ? Number(a.order) : Infinity;
      const ob = b.order ? Number(b.order) : Infinity;
      return oa !== ob ? oa - ob : 0;
    })
    .map((item) => item.tipo);
}

function fileiraDoModal(popover: HTMLElement): string[] {
  return [...popover.querySelectorAll<HTMLElement>("[data-reaction-favorita]")].map(
    (el) => el.getAttribute("data-reaction-favorita") ?? "",
  );
}

describe("attachReactionFavorites", () => {
  beforeEach(() => {
    useReacoesFavoritasStore.setState({ favoritas: [...FAVORITAS_PADRAO], escolheu: false });
  });

  afterEach(() => {
    // A escuta de toque é instalada uma vez por documento (markup do app); o teste casa o documento.
    document.documentElement.removeAttribute("data-reaction-favoritas-toque");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("sem escolha, deixa o compacto do design system como está", () => {
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(marcadas(grade)).toEqual([]);
    expect(popover.hasAttribute("data-reaction-favoritas-fileira")).toBe(false);
  });

  it("no compacto, põe só as favoritas nas primeiras casas, na ordem da escolha", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LAUGH", "LIKE"], escolheu: true });
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");
    expect(marcadas(grade)).toEqual(["LIKE", "LAUGH"]);
    const risos = grade.querySelector<HTMLElement>('[data-reaction-emoji="LAUGH"]');
    expect(risos?.style.getPropertyValue("order")).toBe("0");
  });

  it('fileira vazia esconde todas as reações do compacto e deixa o "+" — que reabre a lista', () => {
    useReacoesFavoritasStore.setState({ favoritas: [], escolheu: true });
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");
    expect(marcadas(grade)).toEqual([]);
    expect(grade.querySelector('button[title="+"]')).not.toBeNull();
  });

  it("no modal, monta a barra da fileira com estrela e setas", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH", "LOVE"], escolheu: true });
    const { popover } = montarSeletor(true);
    attachReactionFavorites(document);
    const barra = popover.querySelector("[data-reaction-favoritas]");
    expect(barra).not.toBeNull();
    expect(fileiraDoModal(popover)).toEqual(["LIKE", "LAUGH", "LOVE"]);
    expect(barra?.querySelector("[data-reaction-favoritas-contagem]")?.textContent).toBe("3/5");
    const primeira = barra?.querySelector<HTMLElement>('[data-reaction-favorita="LIKE"]');
    expect(
      primeira?.querySelector<HTMLButtonElement>('button[aria-label="Mover para a esquerda"]')
        ?.disabled,
    ).toBe(true);
    expect(barra?.querySelector("[data-reaction-favoritas-vazio]")?.hasAttribute("hidden")).toBe(
      true,
    );
  });

  it("a estrela tira da fileira e a seta troca a ordem", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH"], escolheu: true });
    const { popover } = montarSeletor(true);
    attachReactionFavorites(document);
    popover
      .querySelector<HTMLElement>(
        '[data-reaction-favorita="LAUGH"] button[aria-label="Mover para a esquerda"]',
      )
      ?.click();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LAUGH", "LIKE"]);
    attachReactionFavorites(document);
    popover
      .querySelector<HTMLElement>(
        '[data-reaction-favorita="LAUGH"] button[aria-label="Tirar dos favoritos"]',
      )
      ?.click();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE"]);
    attachReactionFavorites(document);
    expect(fileiraDoModal(popover)).toEqual(["LIKE"]);
  });

  it("arrastar a casa põe a favorita na posição em que ela é solta", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH", "LOVE"], escolheu: true });
    const { popover } = montarSeletor(true);
    // O jsdom não faz layout: as casas são medidas pela posição na fileira e o `transform` do
    // arrasto (a casa arrastada precisa ser achada pela ordem do store, e a lista só se redesenha
    // depois de soltar).
    const ordem = ["LIKE", "LAUGH", "LOVE"];
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const tipo = this.getAttribute("data-reaction-favorita") ?? "";
      const indice = ordem.indexOf(tipo);
      const deslocado = Number(
        /translateX\((-?\d+(?:\.\d+)?)px\)/.exec(this.style.transform)?.[1] ?? 0,
      );
      const left = 62 * indice + deslocado;
      const right = left + 58;
      return { left, right, top: 0, bottom: 36, width: 58, height: 36, x: left, y: 0 } as DOMRect;
    });
    const disparar = (alvo: EventTarget, tipo: string, clientX: number, clientY = 10) => {
      const evento = new Event(tipo, { bubbles: true });
      Object.assign(evento, { clientX, clientY, isPrimary: true, button: 0 });
      alvo.dispatchEvent(evento);
    };

    attachReactionFavorites(document);
    const casa = popover.querySelector<HTMLElement>('[data-reaction-favorita="LIKE"]');
    expect(casa).not.toBeNull();
    // Pega na casa (não nos botões), arrasta 130px para a direita e solta sobre a última casa.
    disparar(casa as HTMLElement, "pointerdown", 10);
    disparar(casa?.querySelector("[data-reaction-emoji]") as HTMLElement, "pointermove", 140);
    expect(casa?.getAttribute("data-arrastando")).toBe("sim");
    disparar(casa?.querySelector("[data-reaction-emoji]") as HTMLElement, "pointerup", 140);

    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LAUGH", "LOVE", "LIKE"]);
    attachReactionFavorites(document);
    expect(fileiraDoModal(popover)).toEqual(["LAUGH", "LOVE", "LIKE"]);
    expect(popover.querySelector('[data-arrastando="sim"]')).toBeNull();
  });

  it("um deslize vertical ou um toque sem arrastar não muda a ordem", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH"], escolheu: true });
    const { popover } = montarSeletor(true);
    const disparar = (alvo: EventTarget, tipo: string, x: number, y = 10) => {
      const evento = new Event(tipo, { bubbles: true });
      Object.assign(evento, { clientX: x, clientY: y, isPrimary: true, button: 0 });
      alvo.dispatchEvent(evento);
    };

    attachReactionFavorites(document);
    const casa = popover.querySelector<HTMLElement>('[data-reaction-favorita="LIKE"]');
    const icone = casa?.querySelector("[data-reaction-emoji]") as HTMLElement;
    disparar(casa as HTMLElement, "pointerdown", 10);
    disparar(icone, "pointermove", 14, 120);
    disparar(icone, "pointerup", 14, 120);
    disparar(casa as HTMLElement, "pointerdown", 10);
    disparar(icone, "pointerup", 10);

    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE", "LAUGH"]);
  });

  it("cinco favoritas, duas das quais fora da primeira fileira, aparecem todas: no compacto e no +", () => {
    // O relato: 5 favoritas configuradas, só 2 na primeira linha e no seletor do "+"; as outras 3
    // só voltavam ao resetar. Dois dos tipos (WOW, SAD) não estão entre as seis reações que o
    // compacto do design system desenha antes do "+".
    const gradeCompleta = [...TIPOS, "VIBE"];
    useReacoesFavoritasStore.setState({
      favoritas: ["LIKE", "HEART_PURPLE", "WOW", "SAD", "VIBE"],
      escolheu: true,
    });

    const escolhidas = ["LIKE", "HEART_PURPLE", "WOW", "SAD", "VIBE"];
    // Compacto: as duas que estão entre as seis casas do design system vão para a frente.
    const compacto = montarSeletor(false, gradeCompleta.slice(0, 6));
    // O compacto vem antes do "+" no documento: o anexo o redesenha a cada passada, como no app.
    attachReactionFavorites(document);
    expect(marcadas(compacto.grade)).toEqual(["LIKE", "HEART_PURPLE"]);

    const expandido = montarSeletor(true, gradeCompleta);
    attachReactionFavorites(document);
    // A grade do "+" mostrava só as reações do design system; agora as favoritas vêm na frente.
    expect(ordemDaGrade(expandido.grade).slice(0, 5)).toEqual(escolhidas);
    expect(fileiraDoModal(expandido.popover)).toEqual(escolhidas);
    expect(expandido.grade.querySelectorAll("[data-reaction-emoji]")).toHaveLength(
      gradeCompleta.length,
    );
  });

  it("reagir pelo próprio seletor põe a favorita nova na fileira na hora e na reabertura", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE"], escolheu: true });
    const subscrever = useReacoesFavoritasStore.subscribe((estado, anterior) => {
      if (estado.favoritas !== anterior.favoritas) attachReactionFavorites(document);
    });
    const { popover, grade } = montarSeletor(true);
    attachReactionFavorites(document);

    (grade.querySelector('[data-reaction-emoji="ROFL"]') as HTMLElement).click();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE", "ROFL"]);
    expect(fileiraDoModal(popover)).toEqual(["LIKE", "ROFL"]);
    expect(ordemDaGrade(grade).slice(0, 2)).toEqual(["LIKE", "ROFL"]);

    // Reabrir o seletor (nó novo de outro React) mostra a mesma fileira: o estado é o do store.
    popover.remove();
    const reaberto = montarSeletor(true);
    attachReactionFavorites(document);
    expect(fileiraDoModal(reaberto.popover)).toEqual(["LIKE", "ROFL"]);
    subscrever();
  });

  it("o seletor de uma publicação nova não herda a fileira do anterior", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH"], escolheu: true });
    useReacoesFavoritasStore.getState().alternar("LOVE");
    const primeiro = document.createElement("div");
    primeiro.setAttribute("data-radix-popper-content-wrapper", "");
    primeiro.append(document.createElement("div"));
    document.body.append(primeiro);
    attachReactionFavorites(document);

    // Navegar para outra publicação tira o seletor antigo do documento; o novo nasce limpo.
    primeiro.remove();
    const segundo = montarSeletor(false);
    attachReactionFavorites(document);
    expect(primeiro.querySelector('[data-reaction-emoji="LOVE"]')).toBeNull();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE", "LAUGH", "LOVE"]);
    // A fileira real (o CSS reordena as casas): só as favoritas ficam marcadas, cada uma na sua
    // posição — não há resto do seletor anterior.
    expect(
      [...segundo.grade.querySelectorAll<HTMLElement>('[data-filled="sim"]')]
        .sort((a, b) => Number(a.style.order) - Number(b.style.order))
        .map((el) => el.getAttribute("data-reaction-emoji")),
    ).toEqual(["LIKE", "LAUGH", "LOVE"]);
    expect(
      [...segundo.grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")]
        .filter((el) => el.getAttribute("data-filled") !== "sim")
        .every((el) => el.style.order === ""),
    ).toBe(true);
  });

  it("antes do store carregar, desenha o padrão; o store carrega e a fileira da escolha aparece", async () => {
    window.localStorage.setItem(
      "enois-reacoes-favoritas",
      JSON.stringify({ state: { favoritas: ["WOW", "LAUGH"], escolheu: true }, version: 0 }),
    );
    // Montagem (o app) com o store ainda no padrão: a passada do padrão vem, e depois a do disco.
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    await useReacoesFavoritasStore.persist.rehydrate();
    attachReactionFavorites(document);

    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["WOW", "LAUGH"]);
    expect(
      [...grade.querySelectorAll<HTMLElement>('[data-filled="sim"]')]
        .sort((a, b) => Number(a.style.order) - Number(b.style.order))
        .map((el) => el.getAttribute("data-reaction-emoji")),
    ).toEqual(["WOW", "LAUGH"]);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");

    const expandido = montarSeletor(true);
    attachReactionFavorites(document);
    expect(fileiraDoModal(expandido.popover)).toEqual(["WOW", "LAUGH"]);
    window.localStorage.clear();
  });

  it("no modal, marca a grade com quem é favorita", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE"], escolheu: true });
    const { grade } = montarSeletor(true);
    attachReactionFavorites(document);
    expect(grade.querySelector('[data-reaction-emoji="LIKE"]')?.getAttribute("data-favorita")).toBe(
      "sim",
    );
    expect(grade.querySelector('[data-reaction-emoji="LOVE"]')?.getAttribute("data-favorita")).toBe(
      "nao",
    );
  });
});
