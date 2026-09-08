import { GlobalSearchMobileTrigger } from "@/components/global-search-mobile-trigger";
import { GlobalSearchOverlay } from "@/components/global-search-overlay";

export function GlobalSearch() {
  return (
    <>
      <GlobalSearchMobileTrigger />
      <GlobalSearchOverlay />
    </>
  );
}
