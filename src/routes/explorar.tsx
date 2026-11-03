import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ExploreHub } from "@rede-enois/design-system/domain";

import { signalFor, useNavigationCounts } from "@/lib/navigation-signals";
import { requireAuth } from "@/lib/require-auth";
import { useDisabledModules } from "@/lib/use-personalization";

import { AppContainer } from "@/components/app-container";
import { exploreItems } from "@/components/explore-items";

export const Route = createFileRoute("/explorar")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.explore.seoTitle }] }),
  component: ExplorePage,
});

const SECTION_ORDER = Object.keys(
  texts.explore.sections,
) as (keyof typeof texts.explore.sections)[];

/** Every room that is not on the dock or in the menu: nothing in the app is out of reach. */
function ExplorePage() {
  const disabledModules = useDisabledModules();
  const counts = useNavigationCounts();

  return (
    <AppContainer>
      <ExploreHub
        sections={SECTION_ORDER.map((section) => ({
          id: section,
          title: texts.explore.sections[section],
          items: exploreItems
            .filter((item) => item.section === section)
            .filter((item) => !item.module || !disabledModules.has(item.module))
            .map((item) => ({
              href: item.href,
              label: item.text.label,
              description: item.text.description,
              icon: item.icon,
              color: item.color,
              keywords: item.keywords,
              signal: signalFor({ href: item.href, notifies: item.notifies }, counts),
            })),
        }))}
      />
    </AppContainer>
  );
}
