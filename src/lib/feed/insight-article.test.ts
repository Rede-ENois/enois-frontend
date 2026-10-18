import { describe, expect, it } from "vitest";

import {
  ARTICLE_SUGGESTION_AT,
  INSIGHT_MAX_LENGTH,
  convertInsightToArticle,
  shouldSuggestArticle,
} from "./insight-article";

describe("sugestão de artigo", () => {
  it("não aparece antes do limiar, nem com campo vazio", () => {
    const beforeThreshold = "a".repeat(ARTICLE_SUGGESTION_AT - 1);
    expect(shouldSuggestArticle("INSIGHT", "", "")).toBe(false);
    expect(shouldSuggestArticle("INSIGHT", beforeThreshold, "")).toBe(false);
  });

  it("aparece no limiar e no limite do Insight", () => {
    const atThreshold = "a".repeat(ARTICLE_SUGGESTION_AT);
    const atLimit = "a".repeat(INSIGHT_MAX_LENGTH);
    expect(shouldSuggestArticle("INSIGHT", atThreshold, "")).toBe(true);
    expect(shouldSuggestArticle("INSIGHT", atLimit, "")).toBe(true);
  });

  it("não aparece para outros tipos nem substitui um corpo de artigo existente", () => {
    const atLimit = "a".repeat(INSIGHT_MAX_LENGTH);
    expect(shouldSuggestArticle("ARTICLE", atLimit, "")).toBe(false);
    expect(shouldSuggestArticle("QUESTION", atLimit, "")).toBe(false);
    expect(shouldSuggestArticle("INSIGHT", atLimit, "Rascunho")).toBe(false);
    expect(shouldSuggestArticle("INSIGHT", atLimit + "a", "")).toBe(false);
  });

  it("preserva o texto integral e deixa o título em branco", () => {
    const original = "Primeira linha\n\n**texto formatado** e emoji 🐈";
    expect(convertInsightToArticle(original)).toEqual({
      title: "",
      articleBody: original,
    });
  });
});
