// @vitest-environment jsdom
import { useReacoesFavoritasStore } from "@/stores/reacoes-favoritas.store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITAS_PADRAO } from "./favoritas";
import { attachReactionFavorites, limparCompacto } from "./reaction-picker-favorites";

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

/** Quem está favorita na grade, na ordem do store (a mesma do `data-reaction-na-fileira` no markup). */
/** O compacto de verdade: a figura vem pelo CSS e o coração roxo chega como o caminho do arquivo. */
function montarComoODesignSystem(): { popover: HTMLElement; grade: HTMLElement } {
  const { popover, grade } = montarSeletor(false);
  for (const botao of grade.querySelectorAll<HTMLButtonElement>("button[data-reaction-emoji]")) {
    botao.removeAttribute("data-reaction-emoji");
  }
  grade.innerHTML = "";
  const figuras: [string, string][] = [
    ["LIKE", "👍"],
    ["HEART_PURPLE", "/emojis/enois/heart_purple.svg"],
    ["LOVE", "❤️"],
    ["LAUGH", "😂"],
    ["ROFL", "🤣"],
    ["+", "+"],
  ];
  for (const [tipo, figura] of figuras) {
    const botao = document.createElement("button");
    if (tipo !== "+") botao.dataset.reactionEmoji = tipo;
    else botao.title = "+";
    botao.textContent = figura;
    grade.append(botao);
  }
  return { popover, grade };
}

/** A casa que a favorita ocupa no compacto e a do "+" (o CSS as tira da célula e as põe na linha). */
function ordemCss(el: HTMLElement): string {
  return el.style.getPropertyValue("--favorita-ordem");
}

function marcadas(grade: HTMLElement): string[] {
  return [...grade.querySelectorAll<HTMLElement>('[data-reaction-na-fileira="sim"]')].map(
    (el) => el.getAttribute("data-reaction-emoji") ?? "",
  );
}

/**
 * A ordem em que a grade expandida desenha as reações: a coluna de cada casa (o `data-reaction-coluna`
 * que o hook põe), as colunas pela `order` (sem ela, pela ordem do DOM) e, dentro de cada coluna,
 * as casas na ordem do DOM (`grid-auto-flow: column` — o `order` não mexe nelas).
 */
function ordemDaGrade(grade: HTMLElement): string[] {
  // No markup do app a marca (`data-reaction-emoji`) está no `<span>` dentro do botão; no markup do
  // design system, no próprio botão.
  const casas = [...grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")]
    .filter((el) => el.closest("div.grid.grid-cols-6") === grade)
    .map((el) => ({
      tipo: el.getAttribute("data-reaction-emoji") ?? "",
      coluna:
        (el.parentElement?.hasAttribute("data-reaction-coluna")
          ? el.parentElement
          : el
        )?.getAttribute("data-reaction-coluna") ?? "0",
      order: (el.parentElement?.hasAttribute("data-reaction-coluna") ? el.parentElement : el).style
        .order,
    }));
  const colunas = [...new Set(casas.map((casa) => casa.coluna))].sort((a, b) => {
    const oa = casas.find((casa) => casa.coluna === a)?.order;
    const ob = casas.find((casa) => casa.coluna === b)?.order;
    return (oa ? Number(oa) : Infinity) - (ob ? Number(ob) : Infinity) || Number(a) - Number(b);
  });
  return colunas.flatMap((coluna) =>
    casas.filter((casa) => casa.coluna === coluna).map((casa) => casa.tipo),
  );
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
    expect(risos ? ordemCss(risos) : null).toBe("0");
    // O `order` inline em si é do CSS (vale também entre as casas do compacto): aqui não pode haver.
    expect(risos?.style.order).toBe("");
    expect(grade.querySelector<HTMLElement>('button[title="+"]')?.style.order).toBe("2");
  });

  it('fileira vazia esconde todas as reações do compacto e deixa o "+" — que reabre a lista', () => {
    useReacoesFavoritasStore.setState({ favoritas: [], escolheu: true });
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");
    expect(marcadas(grade)).toEqual([]);
    expect(grade.querySelector('button[title="+"]')).not.toBeNull();
  });

  it("no compacto do DS, dá nome às favoritas e põe a figura do coração roxo no lugar do caminho", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "HEART_PURPLE"], escolheu: true });
    const { grade } = montarComoODesignSystem();
    attachReactionFavorites(document);
    const coracao = grade.querySelector<HTMLButtonElement>('[data-reaction-emoji="HEART_PURPLE"]');
    expect(coracao?.textContent).toBe(" :enois_heart_purple: ");
    const joinha = grade.querySelector<HTMLButtonElement>('[data-reaction-emoji="LIKE"]');
    expect(joinha?.textContent).toBe("👍");
    // O nome decorativo fica longo: se ele ainda fosse ao glypher, a pílula de quem reagiu perderia a figura.
    expect(coracao?.textContent?.length ?? 0).toBeGreaterThan(16);
    // Uma vez basta: a cada nó novo do React o hook roda de novo, e o texto não se multiplica.
    attachReactionFavorites(document);
    expect(coracao?.textContent).toBe(" :enois_heart_purple: ");
    // Quem não está na fileira fica como o DS deixou.
    expect(grade.querySelector('[data-reaction-emoji="LOVE"]')?.textContent).toBe("❤️");
  });

  it("no compacto do DS, o botão de figura que ficou sem texto ganha o emoji dela", () => {
    const { grade } = montarComoODesignSystem();
    const risos = grade.querySelector<HTMLButtonElement>('[data-reaction-emoji="LAUGH"]');
    if (risos) risos.textContent = "";
    attachReactionFavorites(document);
    expect(risos?.textContent).toBe("😂");
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
    // O compacto de verdade desenha só a primeira fileira (até SKULL) e o "+": WOW, SAD e VIBE não
    // estão nele. O hook cria a casa delas com o mesmo desenho e o mesmo `data-reaction-emoji` — o
    // toque do seletor lê o tipo para reagir —, na frente do "+".
    const compacto = montarSeletor(false, [...TIPOS]);
    attachReactionFavorites(document);
    const linha = [
      ...compacto.grade.querySelectorAll<HTMLElement>('[data-reaction-na-fileira="sim"]'),
    ].sort((a, b) => Number(ordemCss(a)) - Number(ordemCss(b)));
    expect(linha.map((el) => el.getAttribute("data-reaction-emoji"))).toEqual(escolhidas);
    expect(linha.map(ordemCss)).toEqual(["0", "1", "2", "3", "4"]);
    // WOW e SAD já são casas da grade que o teste monta; VIBE não existe nela e é a casa criada.
    const criada = compacto.grade.querySelector<HTMLElement>(
      '[data-reaction-favorita-fantasma][data-reaction-emoji="VIBE"]',
    );
    expect(compacto.grade.querySelectorAll("[data-reaction-favorita-fantasma]")).toHaveLength(1);
    expect(criada?.getAttribute("data-reaction-na-fileira")).toBe("sim");
    expect(criada?.title).toBeTruthy();
    expect(criada?.textContent?.trim()).toBeTruthy();
    // A casa criada fica antes do "+" da linha, e o "+" vai depois das favoritas.
    const filhos = [...compacto.grade.children].map(
      (el) => el.getAttribute("data-reaction-emoji") ?? el.getAttribute("title"),
    );
    expect(filhos.at(-2)).toBe("VIBE");
    expect(filhos.at(-1)).toBe("+");

    const expandido = montarSeletor(true, gradeCompleta);
    attachReactionFavorites(document);
    // As colunas com favorita abrem a grade (a de LIKE, a de HEART_PURPLE e a de WOW, onde constam
    // WOW, SAD e VIBE) e a de LAUGH vem depois, fechando a grade.
    expect(ordemDaGrade(expandido.grade)).toEqual([
      "LIKE",
      "HEART_PURPLE",
      "LOVE",
      "WOW",
      "SAD",
      "VIBE",
      "LAUGH",
      "ROFL",
      "SKULL",
    ]);
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
    // A coluna de LIKE abre (primeira favorita) e a de ROFL vem em seguida, inteira — a casa de
    // ROFL sobe para a fileira de cima dela.
    expect(ordemDaGrade(grade).slice(0, 7)).toEqual([
      "LIKE",
      "HEART_PURPLE",
      "LOVE",
      "LAUGH",
      "ROFL",
      "SKULL",
      "WOW",
    ]);

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
      [...segundo.grade.querySelectorAll<HTMLElement>('[data-reaction-na-fileira="sim"]')]
        .sort((a, b) => Number(ordemCss(a)) - Number(ordemCss(b)))
        .map((el) => el.getAttribute("data-reaction-emoji")),
    ).toEqual(["LIKE", "LAUGH", "LOVE"]);
    expect(
      [...segundo.grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")]
        .filter((el) => el.getAttribute("data-reaction-na-fileira") !== "sim")
        .every((el) => ordemCss(el) === "" && el.style.order === ""),
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
      [...grade.querySelectorAll<HTMLElement>('[data-reaction-na-fileira="sim"]')]
        .sort((a, b) => Number(ordemCss(a)) - Number(ordemCss(b)))
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
    // A marca é da coluna (a casa das reações com a contagem): o CSS tira a favorita da coluna
    // dela e a põe na fileira de cima.
    expect(
      grade
        .querySelector<HTMLElement>('[data-reaction-emoji="LIKE"]')
        ?.parentElement?.getAttribute("data-reaction-favorita-grade"),
    ).toBe("sim");
    expect(
      grade
        .querySelector<HTMLElement>('[data-reaction-emoji="LOVE"]')
        ?.parentElement?.hasAttribute("data-reaction-favorita-grade"),
    ).toBe(false);
  });

  it("a limpeza da fileira do compacto não apaga nada do painel do +", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "WOW"], escolheu: true });
    // O compacto marca as casas da fileira e o popover recebe a marca da fileira; o "+" abre, e a
    // limpeza roda antes do painel montar: ela tira as marcas dela e mais nada da grade.
    const compacto = montarSeletor(false);
    attachReactionFavorites(document);
    compacto.popover.remove();
    const painel = montarSeletor(true).popover;
    const grade = painel.firstElementChild as HTMLElement;
    const mais = document.createElement("button");
    mais.title = "+";
    mais.style.setProperty("order", "9");
    grade.append(mais);
    limparCompacto(painel);
    expect(painel.hasAttribute("data-reaction-favoritas-fileira")).toBe(false);
    expect(grade.querySelectorAll("[data-reaction-favorita-fantasma]")).toHaveLength(0);
    expect(grade.querySelectorAll("[data-reaction-na-fileira]")).toHaveLength(0);
    expect(mais.style.order).toBe("9");
    expect(grade.children).toHaveLength(TIPOS.length + 1);
  });

  it("a casa criada para a favorita de fora da primeira fileira não sobra no mural do +", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "VIBE"], escolheu: true });
    const compacto = montarSeletor(false);
    attachReactionFavorites(document);
    expect(
      compacto.grade.querySelector('[data-reaction-favorita-fantasma][data-reaction-emoji="VIBE"]'),
    ).not.toBeNull();

    // O "+": o compacto vira o mural (a mesma grade) e a casa criada sai — o mural já tem VIBE.
    compacto.grade.querySelector('button[title="+"]')?.remove();
    for (const tipo of ["SKULL", "WOW", "SAD", "VIBE"]) {
      const botao = document.createElement("button");
      botao.setAttribute("data-reaction-emoji", tipo);
      compacto.grade.append(botao);
    }
    attachReactionFavorites(document);
    expect(compacto.grade.querySelector("[data-reaction-favorita-fantasma]")).toBeNull();
    expect(compacto.popover.hasAttribute("data-reaction-favoritas-fileira")).toBe(false);
    expect(fileiraDoModal(compacto.popover)).toEqual(["LIKE", "VIBE"]);
  });

  it("a casa criada some quando a favorita deixa de estar na fileira", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "VIBE"], escolheu: true });
    const { grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(grade.querySelector("[data-reaction-favorita-fantasma]")).not.toBeNull();
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE"], escolheu: true });
    attachReactionFavorites(document);
    expect(grade.querySelector("[data-reaction-favorita-fantasma]")).toBeNull();
  });

  it("a favorita de fora da linha que entra na lista ganha a casa na hora, sem esperar o React", () => {
    // A grade do compacto é a do React e só desenha a primeira fileira: escolher uma reação de fora
    // dela (pelo "+") não muda a grade, e a favorita precisa aparecer na linha mesmo assim.
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE"], escolheu: true });
    const { grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(grade.querySelector('[data-reaction-emoji="VIBE"]')).toBeNull();
    useReacoesFavoritasStore.getState().alternar("VIBE");
    const mais = grade.querySelector<HTMLElement>('button[title="+"]');
    for (const tipo of ["SKULL", "WOW", "SAD"]) {
      const botao = document.createElement("button");
      botao.setAttribute("data-reaction-emoji", tipo);
      grade.insertBefore(botao, mais);
    }
    // A casa criada é da fileira (marcada como tal); a grade do React continua sem VIBE própria.
    expect(
      grade.querySelector('[data-reaction-emoji="VIBE"]:not([data-reaction-favorita-fantasma])'),
    ).toBeNull();
    attachReactionFavorites(document);
    expect(
      grade.querySelector<HTMLElement>(
        '[data-reaction-favorita-fantasma][data-reaction-emoji="VIBE"]',
      ),
    ).not.toBeNull();
    expect(
      grade
        .querySelector<HTMLElement>('[data-reaction-emoji="VIBE"]')
        ?.getAttribute("data-reaction-na-fileira"),
    ).toBe("sim");
    // E quando o React desenha o compacto de novo, a casa dele fica no lugar da criada — uma só.
    for (const el of [...grade.children]) {
      if (el.hasAttribute("data-reaction-favorita-fantasma")) el.remove();
    }
    const desenhada = document.createElement("button");
    desenhada.setAttribute("data-reaction-emoji", "VIBE");
    grade.querySelector('button[title="+"]')?.before(desenhada);
    attachReactionFavorites(document);
    expect(grade.querySelectorAll('[data-reaction-emoji="VIBE"]')).toHaveLength(1);
    expect(grade.querySelector("[data-reaction-favorita-fantasma]")).toBeNull();
  });
});
