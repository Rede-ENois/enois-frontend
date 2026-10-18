/** O aviso é antecipado para permitir trocar o formato antes de atingir o teto. */
export const INSIGHT_MAX_LENGTH = 1_200;
export const ARTICLE_SUGGESTION_AT = 1_050;

export function shouldSuggestArticle(postType: string, draft: string, articleBody: string) {
  return (
    postType === "INSIGHT" &&
    draft.length >= ARTICLE_SUGGESTION_AT &&
    draft.length <= INSIGHT_MAX_LENGTH &&
    articleBody.length === 0
  );
}

/** O texto do Insight vira corpo, nunca título: Artigo exige os dois campos separados. */
export function convertInsightToArticle(draft: string) {
  return { title: "", articleBody: draft };
}

/** Escolhe o campo certo ao alternar os formatos sem descartar o rascunho anterior. */
export function draftAfterTypeChange(
  currentType: string,
  nextType: string,
  draft: string,
  articleTitle: string,
  insightBackup: { text: string; mentionedUserIds: string[] } | null,
) {
  const title = currentType === "ARTICLE" && insightBackup ? draft : articleTitle;

  if (nextType === "INSIGHT" && insightBackup) {
    return { draft: insightBackup.text, mentionedUserIds: insightBackup.mentionedUserIds, title };
  }

  if (nextType === "ARTICLE" && insightBackup) {
    return { draft: title, mentionedUserIds: [], title };
  }

  return { draft: null, mentionedUserIds: null, title };
}
