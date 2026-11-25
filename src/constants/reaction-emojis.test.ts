import { REACTION_TYPES } from "@/types/application/reaction/reaction-type";
import { describe, expect, it } from "vitest";

import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";
import { resolveReactionTypeFromGlyph } from "@/lib/reactions/use-enois-reaction-glyphs";

import {
  REACTION_EMOJIS,
  REACTION_EMOJI_ASSETS,
  REACTION_FIGURE_EMOJIS,
  REACTION_PICKER_EMOJIS,
  REACTION_PICKER_FIGURES,
  REACTION_PICKER_ORDER,
} from "./reaction-emojis";

describe("REACTION_EMOJI_ASSETS", () => {
  it("cobre todas as reações oficiais com figurinha única e sem repetições", () => {
    const assets = Object.values(REACTION_EMOJI_ASSETS);

    expect(Object.keys(REACTION_EMOJI_ASSETS)).toEqual([...REACTION_TYPES]);
    expect(new Set(assets).size).toBe(assets.length);
  });

  it("é a reação de cada uma das 77 expressões do pacote, na mesma ordem", () => {
    // Reação e figurinha são a mesma lista: trocar a ordem de um lado sem o outro faria a pílula
    // de uma reação mostrar o ícone de outra.
    expect(REACTION_TYPES).toHaveLength(76);
    expect(ENOIS_CUSTOM_EMOJIS).toHaveLength(77);
    // A fileira do seletor é das reações; o coração roxo é figura A MAIS no pacote (fora da lista).
    expect(Object.values(REACTION_EMOJI_ASSETS)).toEqual(
      ENOIS_CUSTOM_EMOJIS.filter((item) => item.code !== "enois_heart_purple").map(
        (item) => item.src,
      ),
    );
  });

  it("cada reação aponta para um ícone do pacote É Nóis", () => {
    const srcs = new Set(ENOIS_CUSTOM_EMOJIS.map((item) => item.src));

    for (const asset of Object.values(REACTION_EMOJI_ASSETS)) {
      expect(srcs.has(asset)).toBe(true);
      expect(asset.startsWith("/emojis/enois/")).toBe(true);
    }
  });
});

describe("REACTION_EMOJIS", () => {
  it("mantém o emoji das 26 reações antigas, sem repetição", () => {
    const antigas = REACTION_TYPES.slice(0, 26);

    expect(Object.keys(REACTION_EMOJIS).slice(0, 26)).toEqual([...antigas]);
    expect(new Set(Object.values(REACTION_EMOJIS).slice(0, 26)).size).toBe(26);
  });

  it("a reação nova mostra o emoji do mesmo ícone do pacote", () => {
    const porSrc = new Map(ENOIS_CUSTOM_EMOJIS.map((item) => [item.src, item]));

    for (const type of REACTION_TYPES.slice(26)) {
      expect(REACTION_EMOJIS[type], type).toBe(porSrc.get(REACTION_EMOJI_ASSETS[type])?.unicode);
    }
  });
});

describe("REACTION_FIGURE_EMOJIS", () => {
  it("mostra, em cada tipo, o emoji da figura do próprio tipo — nunca o de apoio", () => {
    // O clique grava a CHAVE do mapa; o desenho sai do valor (o leitor de glifo casa o emoji e o
    // CSS pinta o ícone daquele tipo). Se o valor for o emoji de apoio, a pílula de um tipo aparece
    // com o rosto de outro e quem clica no que vê grava outro tipo.
    const porSrc = new Map(ENOIS_CUSTOM_EMOJIS.map((item) => [item.src, item.unicode]));

    expect(Object.keys(REACTION_FIGURE_EMOJIS)).toEqual([...REACTION_TYPES]);
    for (const type of REACTION_TYPES) {
      expect(REACTION_FIGURE_EMOJIS[type], type).toBe(porSrc.get(REACTION_EMOJI_ASSETS[type]));
    }
  });

  it("o leitor de glifo não acha que o emoji da figura é a reação de outro tipo", () => {
    // É o leitor de glifo que transforma o valor em `data-enois-reaction-glyph` (e o CSS pinta o
    // ícone daquele tipo). Quando o emoji da figura casa, tem que casar com o próprio tipo.
    for (const type of REACTION_TYPES) {
      const resolvido = resolveReactionTypeFromGlyph(REACTION_FIGURE_EMOJIS[type]);
      if (resolvido !== null) expect(resolvido, type).toBe(type);
    }
  });

  it("os casos que trocavam o desenho pelo tipo continuam certos", () => {
    // ROFL desenha a estrela e WOW o fumegando: antes, o valor era o emoji de apoio, e a pílula de
    // ROFL aparecia com o rosto de outro tipo.
    expect(REACTION_FIGURE_EMOJIS.ROFL).toBe("✨");
    expect(REACTION_FIGURE_EMOJIS.WOW).toBe("😤");
    expect(REACTION_FIGURE_EMOJIS.SAD).toBe("😎");
    expect(REACTION_FIGURE_EMOJIS.ROFL).not.toBe(REACTION_EMOJIS.ROFL);
  });
});

describe("REACTION_PICKER_ORDER", () => {
  it("abre com o joinha e o coração roxo logo em seguida", () => {
    // O pedido é o coração do lado do joinha: ele é a segunda figura da fileira.
    expect(REACTION_PICKER_ORDER.slice(0, 2)).toEqual(["LIKE", "HEART_PURPLE"]);
  });

  it("depois do coração vêm todas as reações, sem repetir nenhuma", () => {
    const restantes = REACTION_PICKER_ORDER.slice(2);
    expect(restantes).toEqual(REACTION_TYPES.filter((type) => type !== "LIKE"));
    expect(new Set(REACTION_PICKER_ORDER).size).toBe(REACTION_PICKER_ORDER.length);
  });

  it("o coração roxo não é um tipo da API: só o pacote desenha ele", () => {
    expect(REACTION_TYPES).not.toContain("HEART_PURPLE");
    expect(Object.keys(REACTION_EMOJI_ASSETS)).not.toContain("HEART_PURPLE");
  });
});

describe("REACTION_PICKER_EMOJIS", () => {
  it("desenha a figura de cada tipo — o mapa do resumo e das pílulas", () => {
    // O resumo e os diálogos usam este mapa para desenhar `emojis[type]`: cada tipo tem a sua
    // figura, e nenhuma figura é o rosto de outro tipo.
    expect(REACTION_PICKER_EMOJIS).toBe(REACTION_FIGURE_EMOJIS);
    expect(Object.keys(REACTION_PICKER_EMOJIS)).toEqual([...REACTION_TYPES]);
    expect(new Set(Object.values(REACTION_PICKER_EMOJIS)).size).toBe(REACTION_TYPES.length);
  });
});

describe("REACTION_PICKER_FIGURES", () => {
  it("mantém a ordem da fileira e desenha o coração roxo em segundo", () => {
    // O que o seletor recebe: as mesmas chaves, na mesma ordem, e o coração roxo pelo arquivo do
    // pacote — o resto pela figura do próprio tipo.
    expect(Object.keys(REACTION_PICKER_FIGURES)).toEqual([...REACTION_PICKER_ORDER]);
    expect(REACTION_PICKER_FIGURES.HEART_PURPLE).toBe("/emojis/enois/heart_purple.svg");
    for (const type of REACTION_TYPES) {
      expect(REACTION_PICKER_FIGURES[type], type).toBe(REACTION_FIGURE_EMOJIS[type]);
    }
  });
});

describe("coração roxo no pacote É Nóis", () => {
  it("está no pacote com o arquivo servido pelo próprio front", () => {
    const coracao = ENOIS_CUSTOM_EMOJIS.find((item) => item.code === "enois_heart_purple");
    expect(coracao).toBeDefined();
    expect(coracao?.src).toBe("/emojis/enois/heart_purple.svg");
    expect(coracao?.unicode).toBe("💜");
  });
});
