import { texts } from "@/texts";
import type { ModeratorGroupId } from "@/types/routes/moderador/moderator-group-id";
import type { ModeratorTabId } from "@/types/routes/moderador/moderator-tab-id";
import type { PanelGroup } from "@/types/routes/moderador/panel-group";
import type { PanelGroupEntry } from "@/types/routes/moderador/panel-groups-entry";
import type { PanelTab } from "@/types/routes/moderador/panel-tab";

/**
 * A navegação do painel de moderação: quais abas existem, em que grupo cada uma vive e qual
 * grupo é do admin.
 *
 * <p>Vive fora do componente porque a regra é de dados, não de layout — e assim dá para testá-la
 * sem montar a tela inteira. O componente só desenha o que isto devolve.</p>
 */

/** Os grupos, na ordem em que aparecem na tela. */
export const PANEL_GROUPS: PanelGroup[] = [
  { id: "queue", label: texts.moderator.groups.queue },
  { id: "content", label: texts.moderator.groups.content },
  { id: "community", label: texts.moderator.groups.community },
  { id: "admin", label: texts.moderator.groups.admin },
];

export const PANEL_TABS: PanelTab[] = [
  // --- Fila do dia: o que chegou para decidir ---
  {
    id: "reports",
    label: texts.moderator.tabs.reports,
    adminOnly: false,
    queue: true,
  },
  {
    id: "suspicious",
    label: texts.moderator.tabs.suspicious,
    adminOnly: false,
    queue: true,
  },
  {
    id: "suspiciousPosts",
    label: texts.moderator.tabs.suspiciousPosts,
    adminOnly: false,
    queue: true,
  },
  {
    id: "appeals",
    label: texts.moderator.tabs.appeals,
    adminOnly: false,
    queue: true,
  },
  {
    id: "disputes",
    label: texts.moderator.tabs.disputes,
    adminOnly: false,
    queue: true,
  },
  {
    id: "support",
    label: texts.moderator.tabs.support,
    adminOnly: false,
    queue: true,
  },
  {
    id: "suggestions",
    label: texts.moderator.tabs.suggestions,
    adminOnly: false,
    queue: true,
  },

  // --- Conteúdo da plataforma ---
  { id: "games", label: texts.moderator.tabs.games, adminOnly: false },
  { id: "projects", label: texts.moderator.tabs.projects, adminOnly: false },
  { id: "issues", label: texts.moderator.tabs.issues, adminOnly: false },
  { id: "emails", label: texts.moderator.tabs.emails, adminOnly: false },
  {
    id: "monitoring",
    label: texts.moderator.tabs.monitoring,
    adminOnly: false,
  },
  { id: "history", label: texts.moderator.tabs.history, adminOnly: false },

  // --- Comunidade e código ---
  { id: "users", label: texts.moderator.tabs.users, adminOnly: false },
  { id: "pulls", label: texts.moderator.tabs.pulls, adminOnly: false },
  { id: "notes", label: texts.moderator.tabs.notes, adminOnly: false },

  // --- Administração (só admin) ---
  {
    id: "applications",
    label: texts.moderator.tabs.applications,
    adminOnly: true,
  },
  { id: "notices", label: texts.moderator.tabs.notices, adminOnly: true },
  {
    id: "releaseNotes",
    label: texts.moderator.tabs.releaseNotes,
    adminOnly: true,
  },
  {
    id: "contributors",
    label: texts.moderator.tabs.contributors,
    adminOnly: true,
  },
  {
    id: "githubContributions",
    label: texts.moderator.tabs.githubContributions,
    adminOnly: true,
  },
  {
    id: "identityRelease",
    label: texts.moderator.tabs.identityRelease,
    adminOnly: true,
  },
];

/** Em que grupo cada aba vive. */
export const TAB_GROUP_OF: Record<ModeratorTabId, ModeratorGroupId> = {
  reports: "queue",
  suspicious: "queue",
  suspiciousPosts: "queue",
  appeals: "queue",
  disputes: "queue",
  support: "queue",
  suggestions: "queue",

  games: "content",
  projects: "content",
  issues: "content",
  emails: "content",
  monitoring: "content",
  history: "content",

  users: "community",
  pulls: "community",
  notes: "community",

  applications: "admin",
  notices: "admin",
  releaseNotes: "admin",
  contributors: "admin",
  githubContributions: "admin",
  identityRelease: "admin",
};

/**
 * As abas visíveis para quem está olhando, já agrupadas.
 *
 * <p>Grupo que fica sem nenhuma aba visível não aparece: um moderador não-admin não vê o grupo
 * "Administração" vazio.</p>
 */
export function visiblePanelGroups(isAdmin: boolean): PanelGroupEntry[] {
  const tabs = PANEL_TABS.filter((tab) => isAdmin || !tab.adminOnly);
  return PANEL_GROUPS.map((group) => ({
    group,
    tabs: tabs.filter((tab) => TAB_GROUP_OF[tab.id] === group.id),
  })).filter((entry) => entry.tabs.length > 0);
}

/**
 * A aba que o painel mostra de fato: a pedida, se ela for visível; senão a primeira da fila.
 *
 * <p>Sem isto, um moderador que trocasse de papel (admin → moderador) ficaria com uma aba
 * invisível selecionada e a tela vazia.</p>
 */
export function resolveActiveTab(requested: ModeratorTabId, isAdmin: boolean): ModeratorTabId {
  const visible = PANEL_TABS.filter((tab) => isAdmin || !tab.adminOnly);
  return visible.some((tab) => tab.id === requested) ? requested : "reports";
}

/**
 * Para onde o foco vai quando a pessoa usa as setas dentro de um grupo de abas.
 *
 * <p>`null` quando a tecla não é de navegação — o handler do componente deixa o evento seguir.</p>
 */
export function nextTabIndexByKey(key: string, currentIndex: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  if (key === "ArrowRight") {
    return (currentIndex + 1) % total;
  }
  if (key === "ArrowLeft") {
    return (currentIndex - 1 + total) % total;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return total - 1;
  }
  return null;
}

/**
 * As abas do grupo que a aba ativa pertence — e as ÚNICAS que a tela deve desenhar.
 *
 * <p>A navegação antiga empilhava os quatro grupos, cada um com a sua lista de abas: no celular
 * eram vinte e poucas abas em quatro faixas `flex` que não quebram, então as abas das pontas
 * ficavam cortadas e a navegação ocupava a tela inteira antes do conteúdo. Mostrar só o grupo da
 * aba ativa mantém a navegação em uma faixa e deixa o conteúdo visível.</p>
 */
export function tabsOfActiveGroup(activeTab: ModeratorTabId, isAdmin: boolean): PanelTab[] {
  const entry = visiblePanelGroups(isAdmin).find(
    ({ group }) => group.id === TAB_GROUP_OF[activeTab],
  );
  return entry ? entry.tabs : [];
}
