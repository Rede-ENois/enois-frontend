import { texts } from "@/texts";
import { FileText } from "lucide-react";

export function ArticleFormatSuggestion({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="mt-3 rounded-2xl border border-primary/25 bg-primary-soft/40 p-3"
      role="region"
      aria-label={texts.feed.composer.article.suggestionTitle}
    >
      <p className="text-sm font-medium text-foreground">
        {texts.feed.composer.article.suggestionTitle}
      </p>

      <p className="mt-1 text-sm text-text-subtle">
        {texts.feed.composer.article.suggestionDescription}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-1 px-3 py-1.5 text-sm font-medium text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />

        <>{texts.feed.composer.article.suggestionAction}</>
      </button>
    </div>
  );
}
