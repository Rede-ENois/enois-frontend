import { describe, expect, it } from "vitest";

import {
  ARTICLE_SUGGESTION_AT,
  INSIGHT_MAX_LENGTH,
  convertInsightToArticle,
  draftAfterTypeChange,
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

  it("restaura o Insight e suas menções após escrever um título no Artigo", () => {
    const backup = { text: "Insight original @ana", mentionedUserIds: ["ana-id"] };
    const restored = draftAfterTypeChange("ARTICLE", "INSIGHT", "Título escrito", "", backup);

    expect(restored).toEqual({
      draft: backup.text,
      mentionedUserIds: ["ana-id"],
      title: "Título escrito",
    });

    expect(draftAfterTypeChange("INSIGHT", "ARTICLE", backup.text, restored.title, backup)).toEqual({
      draft: "Título escrito",
      mentionedUserIds: [],
      title: "Título escrito",
    });
  });

  it("não substitui texto ao trocar de tipo sem uma conversão prévia", () => {
    expect(draftAfterTypeChange("QUESTION", "INSIGHT", "Pergunta", "", null)).toEqual({
      draft: null,
      mentionedUserIds: null,
      title: "",
    });
  });
});
