import { texts } from "@/texts";
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  FolderKanban,
  Gamepad2,
  GraduationCap,
  Handshake,
  Home,
  Joystick,
  MessageCircle,
  ShoppingBag,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

/** `module` é o identificador que o backend valida em /me/preferences (null = sempre visível). */
export const navigationItems: {
  to: string;
  label: string;
  icon: typeof Home;
  module: string | null;
}[] = [
  { to: "/feed", label: texts.navigation.items.feed, icon: Home, module: null },
  { to: "/rede", label: texts.navigation.items.network, icon: Users, module: null },
  {
    to: "/comunidades",
    label: texts.navigation.items.communities,
    icon: Compass,
    module: "COMMUNITIES",
  },
  { to: "/grupos", label: texts.navigation.items.groups, icon: UsersRound, module: "GROUPS" },
  {
    to: "/mensagens",
    label: texts.navigation.items.messages,
    icon: MessageCircle,
    module: "MESSAGES",
  },
  { to: "/salvos", label: texts.navigation.items.saved, icon: Bookmark, module: null },
  { to: "/blogs", label: texts.navigation.items.blogs, icon: BookOpen, module: "BLOGS" },
  { to: "/vagas", label: texts.navigation.items.jobs, icon: Briefcase, module: "JOBS" },
  { to: "/freelances", label: "Freelances", icon: Handshake, module: "JOBS" },
  {
    to: "/empresas",
    label: texts.navigation.items.companies,
    icon: Building2,
    module: "COMPANIES",
  },
  {
    to: "/mentoria",
    label: texts.navigation.items.mentoring,
    icon: GraduationCap,
    module: "MENTORING",
  },
  { to: "/eventos", label: texts.navigation.items.events, icon: Calendar, module: "EVENTS" },
  { to: "/games", label: "Jogos", icon: Joystick, module: "COMMUNITY_GAMES" },
  {
    to: "/projetos",
    label: "Projetos da comunidade",
    icon: FolderKanban,
    module: "COMMUNITY_PROJECTS",
  },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag, module: null },
  { to: "/servicos", label: "Contratar serviços", icon: Wrench, module: null },
];
