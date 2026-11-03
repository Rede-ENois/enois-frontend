import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ExploreHub } from "@rede-enois/design-system/domain";

import { isOfInterface, useInterfaceContext } from "@/lib/interface-context";
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

/**
 * Every room of the active interface that is not on the dock or in the menu. Rooms of the other
 * interface stay out (Trabalho is professional): the menu switcher is the way across.
 */
function ExplorePage() {
  const disabledModules = useDisabledModules();
  const counts = useNavigationCounts();
  const context = useInterfaceContext();

  return (
    <AppContainer>
      <ExploreHub
        sections={SECTION_ORDER.map((section) => ({
          id: section,
          title: texts.explore.sections[section],
          items: exploreItems
            .filter((item) => item.section === section)
            .filter((item) => !item.module || !disabledModules.has(item.module))
            .filter((item) => isOfInterface(item.href, context))
            .map((item) => ({
              href: item.href,
              label: item.text.label,
              description: item.text.description,
              icon: item.icon,
              color: item.color,
              keywords: item.keywords,
              signal: signalFor({ href: item.href, notifies: item.notifies }, counts),
            })),
        })).filter((section) => section.items.length > 0)}
      />
    </AppContainer>
  );
}
