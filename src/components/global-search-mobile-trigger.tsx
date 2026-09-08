import { texts } from "@/texts";
import type { GlobalSearchMobileTriggerProps } from "@/types/components/global-search/global-search-mobile-trigger-props";
import { Search } from "lucide-react";

export function GlobalSearchMobileTrigger({ onOpen }: GlobalSearchMobileTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="ml-auto grid h-9 w-9 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary md:hidden"
      aria-label={texts.search.action}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
