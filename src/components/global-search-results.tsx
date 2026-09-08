import { texts } from "@/texts";
import { useGlobalSearchContext } from "@/utils/components/search/use-global-search-context";

import { UserAvatar } from "@/components/user-avatar";

export function GlobalSearchResults() {
  const { items, debounced, isFetching, handleSelect } = useGlobalSearchContext();

  return (
    <>
      {items.length === 0 && !isFetching && (
        <p className="px-4 py-6 text-center text-sm text-text-subtle">
          {texts.search.noResults(debounced)}
        </p>
      )}

      <ul className="max-h-80 overflow-y-auto">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <button
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-3"
            >
              <UserAvatar src={item.image} alt={item.title} className="h-10 w-10" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-light text-text-strong">{item.title}</p>

                <p className="truncate text-xs text-text-subtle">{item.subtitle}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
