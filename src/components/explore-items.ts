import { texts } from "@/texts";
import type { NotificationModule } from "@/types/application/notification/notification-module";
import {
  Award,
  Briefcase,
  Building2,
  Code2,
  FolderKanban,
  Gavel,
  GraduationCap,
  Handshake,
  Joystick,
  Lightbulb,
  Puzzle,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";

/**
 * The rooms that live in Explore (not on the dock or in the menu). `module` is the id the backend
 * validates in /me/preferences (null = always offered): a room the person turned off is left out.
 * `color` is a DS table token; `notifies` lights the room's news dot.
 */
export const exploreItems: {
  section: keyof typeof texts.explore.sections;
  href: string;
  text: { label: string; description: string };
  icon: typeof Joystick;
  color: string;
  module: string | null;
  notifies?: NotificationModule;
  keywords?: string[];
}[] = [
  {
    section: "play",
    href: "/games",
    text: texts.explore.items.games,
    icon: Joystick,
    color: "var(--table-5)",
    module: "COMMUNITY_GAMES",
    notifies: "COMMUNITY_GAMES",
    keywords: ["games", "indie"],
  },
  {
    section: "play",
    href: "/jogos-diarios",
    text: texts.explore.items.dailyGames,
    icon: Puzzle,
    color: "var(--table-4)",
    module: "DAILY_GAMES",
    notifies: "DAILY_GAMES",
    keywords: ["jogos diarios", "dobra"],
  },
  {
    section: "build",
    href: "/projetos",
    text: texts.explore.items.projects,
    icon: FolderKanban,
    color: "var(--table-1)",
    module: "COMMUNITY_PROJECTS",
  },
  {
    section: "build",
    href: "/marketplace",
    text: texts.explore.items.marketplace,
    icon: ShoppingBag,
    color: "var(--table-6)",
    module: null,
    keywords: ["marketplace", "cosmeticos", "carteira", "faiscas"],
  },
  {
    section: "build",
    href: "/developers",
    text: texts.explore.items.developers,
    icon: Code2,
    color: "var(--table-3)",
    module: null,
    keywords: ["api", "token", "integracao"],
  },
  {
    section: "community",
    href: "/novidades",
    text: {
      label: "Novidades",
      description: "Atualizações de layout, design system e recursos",
    },
    icon: Sparkles,
    color: "var(--table-4)",
    module: null,
    keywords: ["novidades", "recursos", "changelog", "design system", "layout"],
  },
  {
    section: "community",
    href: "/selos",
    text: texts.explore.items.badges,
    icon: Award,
    color: "var(--table-6)",
    module: null,
    keywords: ["conquistas", "badges"],
  },
  {
    section: "community",
    href: "/sugestoes",
    text: texts.explore.items.suggestions,
    icon: Lightbulb,
    color: "var(--table-2)",
    module: null,
    keywords: ["ideias", "feedback"],
  },
  {
    section: "community",
    href: "/moderador",
    text: texts.explore.items.moderation,
    icon: Gavel,
    color: "var(--table-3)",
    module: null,
    keywords: ["moderador", "denuncias"],
  },
  {
    section: "work",
    href: "/vagas",
    text: texts.explore.items.jobs,
    icon: Briefcase,
    color: "var(--table-3)",
    module: "JOBS",
    notifies: "JOBS",
    keywords: ["emprego", "trabalho"],
  },
  {
    section: "work",
    href: "/freelances",
    text: texts.explore.items.freelances,
    icon: Handshake,
    color: "var(--table-1)",
    module: "JOBS",
  },
  {
    section: "work",
    href: "/servicos",
    text: texts.explore.items.services,
    icon: Wrench,
    color: "var(--table-2)",
    module: null,
  },
  {
    section: "work",
    href: "/empresas",
    text: texts.explore.items.companies,
    icon: Building2,
    color: "var(--table-5)",
    module: "COMPANIES",
    notifies: "COMPANIES",
  },
  {
    section: "work",
    href: "/mentoria",
    text: texts.explore.items.mentoring,
    icon: GraduationCap,
    color: "var(--table-2)",
    module: "MENTORING",
    notifies: "MENTORING",
  },
];
