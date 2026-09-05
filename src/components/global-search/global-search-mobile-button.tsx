import { Search } from "lucide-react";

import { texts } from "@/texts";

export function GlobalSearchMobileButton({ onOpen }: { onOpen: () => void }) {
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
