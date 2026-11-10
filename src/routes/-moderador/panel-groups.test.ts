import type { ModeratorTabId } from "@/types/routes/moderador/moderator-tab-id";
import { describe, expect, it } from "vitest";

import {
  PANEL_GROUPS,
  PANEL_TABS,
  TAB_GROUP_OF,
  nextTabIndexByKey,
  resolveActiveTab,
  tabsOfActiveGroup,
  visiblePanelGroups,
} from "./panel-groups";

/**
 * A navegação do painel de moderação.
 *
 * <p>Antes, a lista era um `select` com 22 opções, sem ordem e sem separar o que é urgente do que
 * é rotina. Estes testes trancam o que a nova navegação promete: cada aba pertence a um grupo, o
 * grupo de administração só existe para admin, e a aba ativa nunca é uma que a pessoa não vê.</p>
 */
describe("painel de moderador: grupos de navegação", () => {
  it("toda aba está em um grupo declarado", () => {
    for (const tab of PANEL_TABS) {
      expect(TAB_GROUP_OF[tab.id], `aba ${tab.id}`).toBeDefined();
    }
  });

  it("todo grupo declarado tem pelo menos uma aba", () => {
    for (const group of PANEL_GROUPS) {
      expect(
        PANEL_TABS.some((tab) => TAB_GROUP_OF[tab.id] === group.id),
        `grupo ${group.id}`,
      ).toBe(true);
    }
  });

  it("nenhuma aba aparece duas vezes", () => {
    const ids = PANEL_TABS.map((tab) => tab.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("o grupo de administração é o único com abas exclusivas de admin", () => {
    for (const tab of PANEL_TABS) {
      if (tab.adminOnly) {
        expect(TAB_GROUP_OF[tab.id], `aba admin ${tab.id}`).toBe("admin");
      }
    }
  });

  it("moderador não-admin não vê o grupo de administração", () => {
    const groups = visiblePanelGroups(false);
    expect(groups.some((entry) => entry.group.id === "admin")).toBe(false);
    expect(groups.flatMap((entry) => entry.tabs).every((tab) => !tab.adminOnly)).toBe(true);
  });

  it("admin vê todos os grupos, inclusive administração", () => {
    const groups = visiblePanelGroups(true);
    expect(groups.map((entry) => entry.group.id)).toEqual(PANEL_GROUPS.map((group) => group.id));
    expect(groups.flatMap((entry) => entry.tabs)).toHaveLength(PANEL_TABS.length);
  });

  it("a fila do dia vem primeiro e começa pelas denúncias", () => {
    const groups = visiblePanelGroups(false);
    expect(groups[0].group.id).toBe("queue");
    expect(groups[0].tabs[0].id).toBe("reports");
  });

  it("nenhum grupo visível fica vazio", () => {
    for (const isAdmin of [true, false]) {
      for (const entry of visiblePanelGroups(isAdmin)) {
        expect(entry.tabs.length, `${entry.group.id} admin=${isAdmin}`).toBeGreaterThan(0);
      }
    }
  });

  it("a aba pedida é respeitada quando a pessoa pode vê-la", () => {
    expect(resolveActiveTab("disputes", false)).toBe("disputes");
    expect(resolveActiveTab("applications", true)).toBe("applications");
  });

  it("aba que a pessoa não pode ver cai na primeira da fila", () => {
    const pedida = "applications" as ModeratorTabId;
    expect(resolveActiveTab(pedida, false)).toBe("reports");
  });

  /**
   * A tela desenha SÓ o grupo da aba ativa. Foi o erro da versão anterior: quatro listas
   * empilhadas, cada uma `flex` sem quebra — no celular as abas das pontas ficavam cortadas e a
   * navegação tomava a tela antes do conteúdo.
   */
  it("só o grupo da aba ativa é desenhado", () => {
    for (const tab of PANEL_TABS) {
      const visiveis = tabsOfActiveGroup(tab.id, true);
      expect(visiveis.length, `aba ${tab.id}`).toBeGreaterThan(0);
      for (const item of visiveis) {
        expect(TAB_GROUP_OF[item.id], `aba ${item.id} vazando de grupo`).toBe(TAB_GROUP_OF[tab.id]);
      }
      // O conjunto devolvido é MENOR que o total: é a prova de que não empilhamos tudo.
      expect(visiveis.length).toBeLessThan(PANEL_TABS.length);
    }
  });

  it("o grupo da aba ativa nunca traz aba de admin para quem não é admin", () => {
    for (const tab of PANEL_TABS) {
      for (const item of tabsOfActiveGroup(tab.id, false)) {
        expect(item.adminOnly, `aba ${item.id}`).toBe(false);
      }
    }
  });
});
