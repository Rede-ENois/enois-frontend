import { useEffect, useRef, useState } from "react";

import { texts } from "@/texts";
import type { StudyPairSearchResult } from "@/types/application/study-pairs/study-pair-search-result";
import { Button, Input } from "@rede-enois/design-system/ui";
import { Search } from "lucide-react";

import { studyPairsApi } from "@/lib/api";
import { topicLabel } from "@/lib/study-pairs/to-study-pair";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/**
 * Busca por texto nos pedidos abertos de par de estudo.
 *
 * O resultado é anônimo de propósito (objetivo, tema e data — sem id nem nome): a pessoa escolhe
 * um objetivo e o pedido sai com esse texto, como se tivesse escrito no formulário. O pareamento
 * continua acontecendo no servidor, com os mesmos filtros de bloqueio, idade e módulo.
 */
/** `onRequest` envia o pedido na hora (o formulário do módulo não aceita preenchimento externo). */
export function GoalSearch({
  onRequest,
  disabled,
}: {
  onRequest: (goal: string, topic: string | null) => void;
  disabled?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<StudyPairSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  // Uma resposta atrasada de um termo anterior não pode sobrescrever a busca atual.
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < MIN_CHARS) {
      requestId.current += 1;
      setItems(null);
      setSearching(false);
      setFailed(false);
      return;
    }

    const current = ++requestId.current;
    setSearching(true);
    setFailed(false);

    const timer = setTimeout(() => {
      studyPairsApi
        .search(trimmed)
        .then((page) => {
          if (requestId.current !== current) return;
          setItems(page.items);
        })
        .catch(() => {
          if (requestId.current !== current) return;
          setFailed(true);
          setItems(null);
        })
        .finally(() => {
          if (requestId.current !== current) return;
          setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term]);

  const trimmed = term.trim();

  return (
    <section className="surface-card space-y-3 p-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium text-text-strong">{texts.studyPairs.search.title}</h2>

        <p className="text-sm text-text-subtle">{texts.studyPairs.search.hint}</p>
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
        />
        <Input
          type="search"
          value={term}
          maxLength={80}
          aria-label={texts.studyPairs.search.title}
          placeholder={texts.studyPairs.search.placeholder}
          className="pl-9"
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>

      <div role="status" aria-live="polite" className="min-h-4 text-xs text-text-subtle">
        {trimmed.length < MIN_CHARS
          ? ""
          : searching
            ? texts.common.loading
            : failed
              ? texts.studyPairs.search.error
              : items && items.length === 0
                ? texts.studyPairs.search.empty
                : items && items.length > 0
                  ? texts.studyPairs.search.results(items.length)
                  : ""}
      </div>

      {items && items.length > 0 && (
        <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border-soft">
          {items.map((item, index) => (
            <li
              key={`${item.goal}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="break-words text-sm font-medium text-text-strong">{item.goal}</p>

                <p className="text-xs text-text-subtle">
                  {item.topic
                    ? (topicLabel(item.topic) ?? item.topic)
                    : texts.studyPairs.search.noTopic}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-auto shrink-0 rounded-full"
                disabled={disabled}
                onClick={() => onRequest(item.goal, item.topic)}
              >
                {texts.studyPairs.search.action}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
