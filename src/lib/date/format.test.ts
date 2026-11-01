import { describe, expect, it, vi } from "vitest";

import {
  dataCurta,
  dataDeEvento,
  dataEHora,
  dataHora,
  dataLonga,
  dataMedia,
  dataSemAno,
  formatarData,
  hojeNoApp,
  hora,
  mesAno,
  monthsBetween,
  paraData,
  partesDaData,
  shortMonthYear,
} from "./format";

/**
 * A data do app é formatada SEMPRE no fuso do app.
 *
 * Isso não é vaidade: o servidor (o pod) roda em UTC e o navegador da pessoa roda no fuso dela.
 * Sem fuso fixo, o servidor escrevia "23 de outubro" e o navegador "24 de outubro", o HTML não
 * batia e o React cuspia *"Hydration failed because the server rendered text didn't match the
 * client"* — que faz o React REGENERAR a árvore inteira no cliente (a página trocando de lugar
 * na hora que abre).
 */
describe("data do app", () => {
  const instante = "2026-10-21T01:35:16Z";

  it("hoje é o dia no fuso do app, não no UTC", () => {
    // 01:35 UTC ainda é dia 20 em São Paulo: a sequência conta o dia de lá.
    expect(hojeNoApp(new Date(instante))).toBe("2026-10-20");
  });

  it("formata a data curta no fuso do app", () => {
    expect(dataCurta(instante)).toBe("20/10/2026");
  });

  it("formata data e hora", () => {
    expect(dataHora(instante)).toBe("20/10/2026, 22:35");
  });

  it("formata só a hora, em 24 horas", () => {
    expect(hora(instante)).toBe("22:35:16");
  });

  it("formata a data por extenso, curta e sem ano", () => {
    expect(dataLonga(instante)).toBe("20 de outubro de 2026");
    expect(dataMedia(instante)).toBe("20 de out. de 2026");
    expect(dataSemAno(instante)).toBe("20 de out.");
    expect(dataEHora(instante)).toBe("20 de out., 22:35");
  });

  it("formata mês e ano", () => {
    expect(mesAno("2023-01-15")).toBe("jan. de 2023");
  });

  it("aceita as opções que cada tela usava", () => {
    expect(formatarData(instante, { day: "2-digit", month: "long", year: "numeric" })).toBe(
      "20 de outubro de 2026",
    );
  });

  it("data sem fuso é o dia de calendário, não o dia anterior", () => {
    // `new Date("2026-10-18")` é meia-noite UTC: em São Paulo seria o dia 17. A data de
    // calendário tem de continuar sendo o dia 18 para todo mundo.
    expect(dataCurta("2026-10-18")).toBe("18/10/2026");
    expect(dataCurta("2026-10-18T12:00:00")).toBe("18/10/2026");
  });

  it("devolve vazio para valor que não é data", () => {
    expect(dataCurta("")).toBe("");
    expect(dataCurta(null)).toBe("");
    expect(dataCurta(undefined)).toBe("");
    expect(dataCurta("não é data")).toBe("");
    expect(paraData("não é data")).toBeNull();
  });

  it("a data de evento sai sem ponto e sem o 'de'", () => {
    expect(dataDeEvento("2026-10-23")).toBe("23 out");
    expect(dataDeEvento("")).toBe("");
  });

  it("lê ano, mês e dia no fuso do app", () => {
    expect(partesDaData("2026-10-18")).toEqual({ ano: 2026, mes: 10, dia: 18 });
    expect(partesDaData(instante)).toEqual({ ano: 2026, mes: 10, dia: 20 });
  });

  it("NÃO depende do fuso do runtime (o do servidor é UTC, o do navegador é o da pessoa)", () => {
    // O mesmo instante, formatado com o runtime em três fusos: a saída tem de ser idêntica.
    // (Mudar `process.env.TZ` troca o fuso do processo — é o mesmo mecanismo do pod em UTC e do
    // navegador da pessoa no fuso dela.)
    const fusoOriginal = process.env.TZ;
    try {
      const saidas = ["UTC", "America/Sao_Paulo", "Asia/Tokyo"].map((fuso) => {
        process.env.TZ = fuso;
        const partes = partesDaData(instante);
        return [
          dataCurta(instante),
          dataHora(instante),
          hora(instante),
          mesAno("2023-01-15"),
          partes?.ano,
          partes?.mes,
          partes?.dia,
        ].join("|");
      });
      expect(saidas[0]).toBe(saidas[1]);
      expect(saidas[1]).toBe(saidas[2]);
      expect(saidas[0]).toBe("20/10/2026|20/10/2026, 22:35|22:35:16|jan. de 2023|2026|10|20");
    } finally {
      process.env.TZ = fusoOriginal;
    }
  });
});

describe("career timeline helpers", () => {
  it("writes the month without the 'de' and counts months inclusively", () => {
    expect(shortMonthYear("2023-01-15")).not.toContain(" de ");
    expect(monthsBetween("2024-01-10", "2024-03-01")).toBe(3);
    expect(monthsBetween("2024-03-10", "2024-03-20")).toBe(1);
  });
});

describe("formatter reuse", () => {
  it("builds each formatter once, however many dates the feed formats", () => {
    dataSemAno("2026-10-01");
    const construir = vi.spyOn(Intl, "DateTimeFormat");
    try {
      for (let dia = 10; dia < 30; dia++) dataSemAno(`2026-10-${dia}`);
      expect(construir).not.toHaveBeenCalled();
    } finally {
      construir.mockRestore();
    }
  });
});
