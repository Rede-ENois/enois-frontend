import { PURPLE_HEART_REACTION } from "@/types/application/reaction/any-reaction-type";
import { describe, expect, it } from "vitest";

import {
  FAVORITAS_MAX,
  FAVORITAS_PADRAO,
  comFavorita,
  ehTipoDeReacao,
  fileiraDaEscolha,
  fileiraDeFavoritas,
  moverFavorita,
  posicionarFavorita,
  reacaoDoCodigo,
  semFavorita,
} from "./favoritas";

const MUITAS = Array.from({ length: FAVORITAS_MAX + 2 }, (_, i) => `REACAO${i}`);

describe("ehTipoDeReacao", () => {
  it("aceita o tipo de reação e o coração roxo", () => {
    expect(ehTipoDeReacao("LIKE")).toBe(true);
    expect(ehTipoDeReacao(PURPLE_HEART_REACTION)).toBe(true);
  });

  it("recusa o que não é reação", () => {
    for (const valor of [null, 3, "", "like", "LIKE!", "/emojis/enois/like.svg", "A".repeat(41)]) {
      expect(ehTipoDeReacao(valor)).toBe(false);
    }
  });
});

describe("reacaoDoCodigo", () => {
  it("lê o código da reação e o código como ele se escreve no texto", () => {
    expect(reacaoDoCodigo("HEART_PURPLE")).toBe("HEART_PURPLE");
    expect(reacaoDoCodigo(" heart_purple ")).toBe("HEART_PURPLE");
    expect(reacaoDoCodigo(":enois_heart_purple:")).toBe("HEART_PURPLE");
    expect(reacaoDoCodigo(":enois_like:")).toBe("LIKE");
  });

  // O texto publicado guarda o caminho do arquivo (`/emojis/enois/heart_purple.svg`), e é ele que
  // a lista de quem reagiu e as views do DS desenham no lugar da figura: o caminho volta a ser
  // reconhecido como a reação, e não como texto (a #1202 trocou o caminho pelo código sem manter
  // os dois, e o texto publicado passou a mostrar o endereço).
  it("lê o arquivo da figura como a reação dela", () => {
    expect(reacaoDoCodigo("/emojis/enois/heart_purple.svg")).toBe("HEART_PURPLE");
    expect(reacaoDoCodigo("/emojis/enois/like.webp")).toBe("LIKE");
    expect(reacaoDoCodigo(" /emojis/enois/heart_purple.svg ")).toBe("HEART_PURPLE");
  });

  it("não confunde texto comum com reação", () => {
    expect(reacaoDoCodigo("Marina Rocha")).toBeNull();
    expect(reacaoDoCodigo("/emojis/enois/outro.svg")).toBeNull();
    expect(reacaoDoCodigo("/emojis/enois/heart_purple.svg?x=1")).toBeNull();
    expect(reacaoDoCodigo("meu /emojis/enois/heart_purple.svg")).toBeNull();
    expect(reacaoDoCodigo(":enois_outra_coisa:")).toBeNull();
    expect(reacaoDoCodigo("")).toBeNull();
    expect(reacaoDoCodigo(null)).toBeNull();
  });
});

describe("semFavorita e comFavorita", () => {
  it("tira só a reação pedida", () => {
    expect(semFavorita(["LIKE", "LOVE"], "LIKE")).toEqual(["LOVE"]);
    expect(semFavorita(["LOVE"], "LIKE")).toEqual(["LOVE"]);
  });

  it("põe no fim, sem repetir e sem passar do limite", () => {
    expect(comFavorita(["LIKE"], "LOVE")).toEqual(["LIKE", "LOVE"]);
    expect(comFavorita(["LIKE", "LOVE"], "LIKE")).toEqual(["LIKE", "LOVE"]);
    expect(comFavorita(MUITAS, "LOVE")).toEqual(MUITAS.slice(0, FAVORITAS_MAX));
  });
});

describe("moverFavorita", () => {
  it("troca de lugar uma casa por vez", () => {
    expect(moverFavorita(["LIKE", "LOVE", "LAUGH"], "LOVE", -1)).toEqual(["LOVE", "LIKE", "LAUGH"]);
    expect(moverFavorita(["LIKE", "LOVE", "LAUGH"], "LOVE", 1)).toEqual(["LIKE", "LAUGH", "LOVE"]);
  });

  it("não sai das pontas nem inventa reação", () => {
    expect(moverFavorita(["LIKE", "LOVE"], "LIKE", -1)).toEqual(["LIKE", "LOVE"]);
    expect(moverFavorita(["LIKE", "LOVE"], "LOVE", 1)).toEqual(["LIKE", "LOVE"]);
    expect(moverFavorita(["LIKE"], "WOW", 1)).toEqual(["LIKE"]);
  });
});

describe("posicionarFavorita", () => {
  it("põe a reação na casa pedida, empurrando as outras", () => {
    expect(posicionarFavorita(["LIKE", "LOVE", "LAUGH"], "LIKE", 2)).toEqual([
      "LOVE",
      "LAUGH",
      "LIKE",
    ]);
    expect(posicionarFavorita(["LIKE", "LOVE", "LAUGH"], "LAUGH", 0)).toEqual([
      "LAUGH",
      "LIKE",
      "LOVE",
    ]);
  });

  it("não muda a fileira para reação ausente e prende o índice nos limites", () => {
    expect(posicionarFavorita(["LIKE", "LOVE"], "WOW", 1)).toEqual(["LIKE", "LOVE"]);
    expect(posicionarFavorita(["LIKE", "LOVE"], "LIKE", 9)).toEqual(["LOVE", "LIKE"]);
    expect(posicionarFavorita(["LIKE", "LOVE"], "LOVE", -3)).toEqual(["LOVE", "LIKE"]);
    expect(posicionarFavorita(["LIKE", "LOVE"], "LOVE", 1)).toEqual(["LIKE", "LOVE"]);
  });
});

describe("fileiraDeFavoritas", () => {
  it("abre com o padrão (joinha e coração roxo) e completa até o limite", () => {
    const elegiveis = ["LIKE", PURPLE_HEART_REACTION, "LOVE", "LAUGH", "ROFL", "SKULL", "WOW"];
    expect(FAVORITAS_PADRAO).toEqual(["LIKE", PURPLE_HEART_REACTION]);
    expect(fileiraDeFavoritas(FAVORITAS_PADRAO, elegiveis)).toEqual([
      "LIKE",
      PURPLE_HEART_REACTION,
      "LOVE",
      "LAUGH",
      "ROFL",
    ]);
  });

  it("respeita a ordem da escolha e ignora reação que o seletor não tem", () => {
    const elegiveis = ["LIKE", PURPLE_HEART_REACTION, "LOVE", "LAUGH"];
    expect(fileiraDeFavoritas(["LAUGH", "APOSENTADA", "LOVE"], elegiveis)).toEqual([
      "LAUGH",
      "LOVE",
      "LIKE",
      PURPLE_HEART_REACTION,
    ]);
  });

  it("completa a fileira vazia com o que existe", () => {
    expect(fileiraDeFavoritas([], ["LIKE", "LOVE"])).toEqual(["LIKE", "LOVE"]);
  });
});

describe("fileiraDaEscolha", () => {
  it("mostra só a escolha, na ordem dela", () => {
    expect(fileiraDaEscolha(["LAUGH", "LIKE"], ["LIKE", "LOVE", "LAUGH", "ROFL"])).toEqual([
      "LAUGH",
      "LIKE",
    ]);
  });

  it("não completa com outras reações e corta o que não existe mais", () => {
    expect(fileiraDaEscolha(["APOSENTADA"], ["LIKE", "LOVE"])).toEqual([]);
  });

  it("sem repetir e no máximo FAVORITAS_MAX", () => {
    expect(fileiraDaEscolha([...MUITAS, MUITAS[0]], MUITAS)).toEqual(
      MUITAS.slice(0, FAVORITAS_MAX),
    );
  });
});
