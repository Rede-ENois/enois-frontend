import { useRef } from "react";

import type { PostView } from "@/types/application/feed/post-view";
import type { Props } from "@/types/hooks/use-insight-article-conversion/props";

import {
  convertInsightToArticle,
  draftAfterTypeChange,
  shouldSuggestArticle,
} from "@/lib/feed/insight-article";

export function useInsightArticleConversion({
  draft,
  setDraft,
  articleBody,
  setArticleBody,
  mentionedUserIds,
  setMentionedUserIds,
  postType,
  setPostType,
  setTypePickerOpen,
}: Props) {
  const insightBackup = useRef<{ text: string; mentionedUserIds: string[] } | null>(null);
  const articleTitleBackup = useRef("");

  const showArticleSuggestion = shouldSuggestArticle(postType, draft, articleBody);

  const onDraftChange = (value: string, ids: string[]) => {
    setDraft(value);
    setMentionedUserIds(ids);

    // O Insight pode ser editado depois de voltar do Artigo: mantenha a cópia sincronizada.
    if (postType === "INSIGHT" && insightBackup.current) {
      insightBackup.current = { text: value, mentionedUserIds: ids };
    }
  };

  const continueAsArticle = () => {
    if (!showArticleSuggestion) return;

    const conversion = convertInsightToArticle(draft);
    insightBackup.current = { text: draft, mentionedUserIds };
    articleTitleBackup.current = conversion.title;
    setArticleBody(conversion.articleBody);
    setDraft(conversion.title);
    setMentionedUserIds([]);
    setPostType("ARTICLE");
    setTypePickerOpen(false);
  };

  const selectPostType = (next: PostView["type"]) => {
    // Guarda o título separado do Insight, para que alternar formatos não descarte nenhum texto.
    const selected = draftAfterTypeChange(
      postType,
      next,
      draft,
      articleTitleBackup.current,
      insightBackup.current,
    );
    articleTitleBackup.current = selected.title;
    if (selected.draft !== null) setDraft(selected.draft);
    if (selected.mentionedUserIds !== null) setMentionedUserIds(selected.mentionedUserIds);
    setPostType(next);
    setTypePickerOpen(false);
  };

  const clearConversion = () => {
    insightBackup.current = null;
    articleTitleBackup.current = "";
  };

  return {
    showArticleSuggestion,
    onDraftChange,
    continueAsArticle,
    selectPostType,
    clearConversion,
  };
}
