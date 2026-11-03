import { texts } from "@/texts";
import { Bell, Home, LayoutGrid, MessageCircle } from "lucide-react";

/** The phone dock's four destinations; everything else is behind the menu button. */
export const DOCK_DESTINATIONS = [
  { href: "/feed", label: texts.navigation.items.feed, icon: Home },
  { href: "/explorar", label: texts.navigation.items.explore, icon: LayoutGrid },
  { href: "/mensagens", label: texts.navigation.items.messages, icon: MessageCircle },
  { href: "/notificacoes", label: texts.dock.notices, icon: Bell },
];
