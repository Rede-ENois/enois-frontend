import { useInterfaceContext } from "@/lib/interface-context";
import { signalFor, useNavigationCounts } from "@/lib/navigation-signals";
import { useDisabledModules } from "@/lib/use-personalization";

import { DOCK_DESTINATIONS } from "./dock-destinations";
import { navigationItemsFor } from "./navigation-items";

const ON_THE_DOCK = new Set(DOCK_DESTINATIONS.map((destination) => destination.href));

/**
 * Whether a menu entry that is not on the dock has news (requests, communities, events...): the
 * phone's menu button shows a dot, so that news is not hidden behind the drawer.
 */
export function useMenuHasNews(): boolean {
  const context = useInterfaceContext();
  const disabledModules = useDisabledModules();
  const counts = useNavigationCounts();

  return navigationItemsFor(context).some(
    (item) =>
      !ON_THE_DOCK.has(item.to) &&
      (!item.module || !disabledModules.has(item.module)) &&
      signalFor({ href: item.to, notifies: item.notifies }, counts) !== null,
  );
}
