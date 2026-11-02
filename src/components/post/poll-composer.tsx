import { POLL_MAX_OPTIONS, POLL_OPTION_MAX_LENGTH } from "@/constants/post-types";
import { texts } from "@/texts";
import { Plus, X } from "lucide-react";

/**
 * Alternativas da enquete no composer. O título é o campo de texto de cima; aqui ficam as opções
 * (2 a 6), que são o que a pessoa vota. O componente só edita a lista — quem publica normaliza
 * (tira vazio, corta o excesso) e o backend valida de novo.
 */
export function PollComposer({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const update = (position: number, value: string) => {
    onChange(options.map((option, index) => (index === position ? value : option)));
  };

  return (
    <div className="mt-3 rounded-2xl border border-border-soft bg-surface-1 p-3">
      <span className="mb-1 block text-sm font-normal text-text-subtle">
        {texts.posts.poll.optionsLabel}
      </span>

      <p className="mb-2 text-xs text-text-subtle">{texts.posts.poll.hint}</p>

      <div className="flex flex-col gap-1.5">
        {options.map((option, position) => (
          <div key={position} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              maxLength={POLL_OPTION_MAX_LENGTH}
              onChange={(event) => update(position, event.target.value)}
              placeholder={texts.posts.poll.optionPlaceholder(position + 1)}
              aria-label={texts.posts.poll.optionPlaceholder(position + 1)}
              className="min-w-0 flex-1 rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
            />

            {options.length > 2 && (
              <button
                type="button"
                onClick={() => onChange(options.filter((_value, index) => index !== position))}
                title={texts.posts.poll.removeOption}
                aria-label={texts.posts.poll.removeOption}
                className="rounded-lg p-1.5 text-text-subtle transition hover:bg-muted hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < POLL_MAX_OPTIONS && (
        <button
          type="button"
          onClick={() => onChange([...options, ""])}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-sm font-normal text-text-subtle transition hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />

          {texts.posts.poll.addOption}
        </button>
      )}
    </div>
  );
}
