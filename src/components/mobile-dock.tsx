import { useNavigate, useRouterState } from "@tanstack/react-router";

import { texts } from "@/texts";
import { MobileDock as MobileDockView } from "@rede-enois/design-system/patterns";
import { Bell, Home, LayoutGrid, MessageCircle, Plus } from "lucide-react";

import { signalFor, useNavigationCounts } from "@/lib/navigation-signals";

const DESTINATIONS = [
  { href: "/feed", label: texts.navigation.items.feed, icon: Home },
  { href: "/explorar", label: texts.navigation.items.explore, icon: LayoutGrid },
  { href: "/mensagens", label: texts.navigation.items.messages, icon: MessageCircle },
  { href: "/notificacoes", label: texts.dock.notices, icon: Bell },
];

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
      items={DESTINATIONS.map((destination) => ({
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
