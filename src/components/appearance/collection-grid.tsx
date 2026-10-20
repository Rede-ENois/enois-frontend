import { useMemo, useState } from "react";

import { THEME_COLLECTIONS } from "@/constants/theme-collections";
import { texts } from "@/texts";
import type { CollectionGridProps } from "@/types/components/appearance/collection-grid-props";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { CollectionPreview } from "./collection-preview";

const CATEGORIES = [
  { id: null, label: texts.appearance.categoryAll },
  { id: "casa", label: texts.appearance.categoryCasa },
  { id: "jogos", label: texts.appearance.categoryJogos },
  { id: "maquinas", label: texts.appearance.categoryMaquinas },
  { id: "papel", label: texts.appearance.categoryPapel },
  { id: "retro", label: texts.appearance.categoryRetro },
];

/**
 * Galeria de temas.
 *
 * Cada cartão é uma amostra real do tema (miniatura com fundo, superfície,
 * destaque e o efeito que o define) com nome e uma linha de descrição — não é
 * uma lista de nomes sem contexto. Selecionar aplica na hora; o cartão do
 * Padrão Énóis restaura a marca com um clique.
 */
export function CollectionGrid({ activeId, onSelect }: CollectionGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return THEME_COLLECTIONS.filter((collection) => {
      const catOk =
        !category ||
        (category === "retro"
          ? (collection.category ?? "retro") === "retro"
          : collection.category === category);
      const textOk =
        !needle ||
        collection.name.toLowerCase().includes(needle) ||
        collection.description.toLowerCase().includes(needle);
      return catOk && textOk;
    });
  }, [query, category]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={texts.appearance.themeSearchPlaceholder}
            className="h-9 w-full rounded-full border border-border-soft bg-surface-1 pl-9 pr-3 text-xs outline-none transition focus:border-primary"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                category === cat.id
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border-soft text-text-subtle hover:text-text-strong",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={activeId === null}
          className={cn(
            "rounded-xl border p-2 text-left transition",
            activeId === null
              ? "border-primary ring-1 ring-primary"
              : "border-border-soft hover:border-border",
          )}
        >
          <div
            className="flex h-16 w-full flex-col rounded-md border border-border-soft p-1.5"
            style={{ background: "linear-gradient(135deg, #f9f8ff, #ede8f5)" }}
          >
            <div className="h-1.5 w-2/3 rounded-full bg-primary" />
            <div className="mt-1 h-1 w-full rounded-full bg-border-soft" />
            <div className="mt-0.5 h-1 w-3/5 rounded-full bg-border-soft" />

            <span className="mt-auto inline-flex h-4 w-fit items-center self-start rounded-full bg-primary px-1.5 text-[9px] leading-none text-primary-foreground">
              Aa
            </span>
          </div>

          <p className="mt-1.5 text-xs font-medium text-text-strong">
            {texts.appearance.defaultThemeName}
          </p>

          <p className="text-[11px] leading-tight text-text-subtle">
            {texts.appearance.defaultThemeDescription}
          </p>
        </button>

        {filtered.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => onSelect(collection.id)}
            aria-pressed={activeId === collection.id}
            className={cn(
              "rounded-xl border p-2 text-left transition",
              activeId === collection.id
                ? "border-primary ring-1 ring-primary"
                : "border-border-soft hover:border-border",
            )}
          >
            <CollectionPreview collection={collection} />

            <p className="mt-1.5 text-xs font-medium text-text-strong">{collection.name}</p>

            <p className="text-[11px] leading-tight text-text-subtle">{collection.description}</p>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-2 py-4 text-center text-xs text-text-subtle sm:col-span-3">
            {texts.appearance.themeSearchEmpty}
          </p>
        )}
      </div>
    </div>
  );
}
