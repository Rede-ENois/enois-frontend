import { useNavigate, useRouterState } from "@tanstack/react-router";

import { useAppShellStore } from "@/stores/app-shell.store";
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
  // Chat apps hide the tab bar inside a thread: the floating dock covered the composer (and rose
  // with the keyboard over it). The back arrow of the thread leads to the list, where it returns.
  const conversationOpen = useAppShellStore((state) => state.conversationOpen);

  if (conversationOpen) return null;

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
