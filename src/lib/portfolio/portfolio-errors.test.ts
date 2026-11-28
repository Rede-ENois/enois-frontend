import { texts } from "@/texts";
import { describe, expect, it } from "vitest";

import { portfolioErrorText } from "./portfolio-errors";

describe("portfolioErrorText", () => {
  it("traduz os códigos conhecidos do portfólio", () => {
    expect(portfolioErrorText("MAX_PORTFOLIO_BLOCKS", "limite")).toBe(texts.portfolio.blockLimit);
    expect(portfolioErrorText("INVALID_PORTFOLIO_HTML", "html")).toBe(texts.portfolio.invalidPage);
    expect(portfolioErrorText("PORTFOLIO_ORDER_INVALID", "ordem")).toBe(
      texts.portfolio.reorderError,
    );
  });

  it("código desconhecido cai na mensagem do servidor", () => {
    expect(portfolioErrorText("ALGO_NOVO", "Mensagem do servidor")).toBe("Mensagem do servidor");
  });

  it("sem código nem mensagem, o texto é o de salvar a página", () => {
    expect(portfolioErrorText(undefined, undefined)).toBe(texts.portfolio.savePageError);
  });
});
