import { texts } from "@/texts";
import type { InterfaceContext } from "@rede-enois/design-system/domain";
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  FolderKanban,
  GraduationCap,
  Handshake,
  Home,
  IdCard,
  Joystick,
  MessageCircle,
  NotebookPen,
  ShoppingBag,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

/**
 * The main menu of each interface. `module` is the id the backend validates in /me/preferences
 * (null = always visible); `context` is the interface the entry belongs to (null = both). The
 * route classification in `lib/interface-context` must agree with it (tested).
 */
export const navigationItems: {
  to: string;
  label: string;
  icon: typeof Home;
  module: string | null;
  context: InterfaceContext | null;
}[] = [
  { to: "/feed", label: texts.navigation.items.feed, icon: Home, module: null, context: null },
  {
    to: "/mensagens",
    label: texts.navigation.items.messages,
    icon: MessageCircle,
    module: "MESSAGES",
    context: null,
  },
  // Social: community life.
  {
    to: "/rede",
    label: texts.navigation.items.network,
    icon: Users,
    module: null,
    context: "SOCIAL",
  },
  {
    to: "/comunidades",
    label: texts.navigation.items.communities,
    icon: Compass,
    module: "COMMUNITIES",
    context: "SOCIAL",
  },
  {
    to: "/grupos",
    label: texts.navigation.items.groups,
    icon: UsersRound,
    module: "GROUPS",
    context: "SOCIAL",
  },
  {
    to: "/salvos",
    label: texts.navigation.items.saved,
    icon: Bookmark,
    module: null,
    context: "SOCIAL",
  },
  {
    to: "/blogs",
    label: texts.navigation.items.blogs,
    icon: BookOpen,
    module: "BLOGS",
    context: "SOCIAL",
  },
  {
    to: "/eventos",
    label: texts.navigation.items.events,
    icon: Calendar,
    module: "EVENTS",
    context: "SOCIAL",
  },
  {
    to: "/par-de-estudo",
    label: texts.navigation.items.studyPairs,
    icon: NotebookPen,
    module: "STUDY_PAIRS",
    context: "SOCIAL",
  },
  {
    to: "/games",
    label: texts.navigation.items.games,
    icon: Joystick,
    module: "COMMUNITY_GAMES",
    context: "SOCIAL",
  },
  {
    to: "/projetos",
    label: texts.navigation.items.communityProjects,
    icon: FolderKanban,
    module: "COMMUNITY_PROJECTS",
    context: "SOCIAL",
  },
  // The marketplace is the wallet tab (cosmetics and faíscas), not work.
  {
    to: "/marketplace",
    label: texts.navigation.items.marketplace,
    icon: ShoppingBag,
    module: null,
    context: "SOCIAL",
  },
  // Professional: work.
  {
    to: "/vagas",
    label: texts.navigation.items.jobs,
    icon: Briefcase,
    module: "JOBS",
    context: "PROFESSIONAL",
  },
  {
    to: "/freelances",
    label: texts.navigation.items.freelances,
    icon: Handshake,
    module: "JOBS",
    context: "PROFESSIONAL",
  },
  {
    to: "/servicos",
    label: texts.navigation.items.services,
    icon: Wrench,
    module: null,
    context: "PROFESSIONAL",
  },
  {
    to: "/empresas",
    label: texts.navigation.items.companies,
    icon: Building2,
    module: "COMPANIES",
    context: "PROFESSIONAL",
  },
  {
    to: "/mentoria",
    label: texts.navigation.items.mentoring,
    icon: GraduationCap,
    module: "MENTORING",
    context: "PROFESSIONAL",
  },
  {
    to: "/profissional",
    label: texts.navigation.items.professionalProfile,
    icon: IdCard,
    module: null,
    context: "PROFESSIONAL",
  },
];

/** The entries of one interface (plus the shared ones), in menu order. */
export function navigationItemsFor(context: InterfaceContext) {
  return navigationItems.filter((item) => item.context === null || item.context === context);
}
