import { texts } from "@/texts";
import type { NotificationModule } from "@/types/application/notification/notification-module";
import type { InterfaceContext, NavigationSection } from "@rede-enois/design-system/domain";
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Compass,
  GraduationCap,
  Handshake,
  Home,
  IdCard,
  LayoutGrid,
  MessageCircle,
  NotebookPen,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

/**
 * The main menu of each interface. `module` is the id the backend validates in /me/preferences
 * (null = always visible); `context` is the interface the entry belongs to (null = both). The
 * route classification in `lib/interface-context` must agree with it (tested). `section` groups
 * the entry; `notifies` is the notification area whose unread count lights its signal. Rooms that
 * are not used daily (games, projects, marketplace) live in Explore (`explore-items`).
 */
export const navigationItems: {
  to: string;
  label: string;
  icon: typeof Home;
  module: string | null;
  context: InterfaceContext | null;
  section: NavigationSection;
  notifies?: NotificationModule;
}[] = [
  {
    to: "/feed",
    label: texts.navigation.items.feed,
    icon: Home,
    module: null,
    context: null,
    section: "you",
  },
  {
    to: "/mensagens",
    label: texts.navigation.items.messages,
    icon: MessageCircle,
    module: "MESSAGES",
    context: null,
    section: "you",
  },
  {
    to: "/rede",
    label: texts.navigation.items.network,
    icon: Users,
    module: null,
    context: "SOCIAL",
    section: "you",
  },
  {
    to: "/salvos",
    label: texts.navigation.items.saved,
    icon: Bookmark,
    module: null,
    context: "SOCIAL",
    section: "you",
  },
  // Social: community life.
  {
    to: "/comunidades",
    label: texts.navigation.items.communities,
    icon: Compass,
    module: "COMMUNITIES",
    context: "SOCIAL",
    section: "community",
  },
  {
    to: "/grupos",
    label: texts.navigation.items.groups,
    icon: UsersRound,
    module: "GROUPS",
    context: "SOCIAL",
    section: "community",
    notifies: "GROUPS",
  },
  {
    to: "/eventos",
    label: texts.navigation.items.events,
    icon: Calendar,
    module: "EVENTS",
    context: "SOCIAL",
    section: "community",
    notifies: "EVENTS",
  },
  {
    to: "/blogs",
    label: texts.navigation.items.blogs,
    icon: BookOpen,
    module: "BLOGS",
    context: "SOCIAL",
    section: "community",
    notifies: "BLOGS",
  },
  {
    to: "/par-de-estudo",
    label: texts.navigation.items.studyPairs,
    icon: NotebookPen,
    module: "STUDY_PAIRS",
    context: "SOCIAL",
    section: "community",
    notifies: "STUDY_PAIRS",
  },
  // Professional: work.
  {
    to: "/vagas",
    label: texts.navigation.items.jobs,
    icon: Briefcase,
    module: "JOBS",
    context: "PROFESSIONAL",
    section: "work",
    notifies: "JOBS",
  },
  {
    to: "/freelances",
    label: texts.navigation.items.freelances,
    icon: Handshake,
    module: "JOBS",
    context: "PROFESSIONAL",
    section: "work",
  },
  {
    to: "/servicos",
    label: texts.navigation.items.services,
    icon: Wrench,
    module: null,
    context: "PROFESSIONAL",
    section: "work",
  },
  {
    to: "/empresas",
    label: texts.navigation.items.companies,
    icon: Building2,
    module: "COMPANIES",
    context: "PROFESSIONAL",
    section: "work",
    notifies: "COMPANIES",
  },
  {
    to: "/mentoria",
    label: texts.navigation.items.mentoring,
    icon: GraduationCap,
    module: "MENTORING",
    context: "PROFESSIONAL",
    section: "work",
    notifies: "MENTORING",
  },
  {
    to: "/profissional",
    label: texts.navigation.items.professionalProfile,
    icon: IdCard,
    module: null,
    context: "PROFESSIONAL",
    section: "work",
  },
  // Both: the doorway to every other room.
  {
    to: "/explorar",
    label: texts.navigation.items.explore,
    icon: LayoutGrid,
    module: null,
    context: null,
    section: "explore",
  },
  // Both: a agenda atende a vida social e a profissional, então não pertence a nenhuma interface nem
  // a um módulo desligável (D16). O backend responde 401 sem sessão e nunca devolve compromisso de
  // outra pessoa, então aparecer sempre não abre nada.
  {
    to: "/agenda",
    label: texts.navigation.items.agenda,
    icon: CalendarDays,
    module: null,
    context: null,
    section: "explore",
  },
];

/** The entries of one interface (plus the shared ones), in menu order. */
export function navigationItemsFor(context: InterfaceContext) {
  return navigationItems.filter((item) => item.context === null || item.context === context);
}
