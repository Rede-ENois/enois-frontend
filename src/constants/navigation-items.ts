import {
  Bookmark,
  Briefcase,
  Calendar,
  Compass,
  GraduationCap,
  Home,
  MessageCircle,
  Users,
} from "lucide-react";

import { texts } from "@/texts";

export const navigationItems = [
  { to: "/feed", label: texts.navigation.items.feed, icon: Home },
  { to: "/rede", label: texts.navigation.items.network, icon: Users },
  { to: "/comunidades", label: texts.navigation.items.communities, icon: Compass },
  { to: "/mensagens", label: texts.navigation.items.messages, icon: MessageCircle },
  { to: "/salvos", label: texts.navigation.items.saved, icon: Bookmark },
  { to: "/vagas", label: texts.navigation.items.jobs, icon: Briefcase },
  { to: "/mentoria", label: texts.navigation.items.mentoring, icon: GraduationCap },
  { to: "/eventos", label: texts.navigation.items.events, icon: Calendar },
];
