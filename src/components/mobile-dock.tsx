import { useNavigate, useRouterState } from "@tanstack/react-router";

import { texts } from "@/texts";
import { MobileDock as MobileDockView } from "@rede-enois/design-system/patterns";
import { Plus } from "lucide-react";

import { signalFor, useNavigationCounts } from "@/lib/navigation-signals";

import { DOCK_DESTINATIONS } from "./dock-destinations";

/**
 * The phone's daily destinations a thumb away, with the same signals as the menu. "Publicar" opens
 * the feed composer (`compor=POST`), wherever the person is.
 */
export function MobileDock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const counts = useNavigationCounts();

  return (
    <MobileDockView
      items={DOCK_DESTINATIONS.map((destination) => ({
        ...destination,
        active: pathname === destination.href || pathname.startsWith(`${destination.href}/`),
        signal: signalFor({ href: destination.href }, counts),
      }))}
      action={{
        label: texts.dock.publish,
        icon: Plus,
        onClick: () => void navigate({ to: "/feed", search: { compor: "POST" } }),
      }}
    />
  );
}
