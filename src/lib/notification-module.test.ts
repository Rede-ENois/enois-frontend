import { describe, expect, it } from "vitest";

import { isNotificationHidden, moduleForNotification } from "./notification-module";

describe("moduleForNotification", () => {
  it("mapeia os tipos do backend (maiúsculas) para os módulos desativáveis", () => {
    expect(moduleForNotification("NEW_MESSAGE")).toBe("MESSAGES");
    expect(moduleForNotification("EVENT")).toBe("EVENTS");
    expect(moduleForNotification("JOB")).toBe("JOBS");
    expect(moduleForNotification("MENTORING")).toBe("MENTORING");
    expect(moduleForNotification("JOGO_DIARIO")).toBe("DAILY_GAMES");
  });

  it("tipos de grupo (com prefixo) pertencem a GRUPOS", () => {
    expect(moduleForNotification("GROUP_JOIN_REQUEST")).toBe("GROUPS");
    expect(moduleForNotification("NEW_GROUP_COMMENT")).toBe("GROUPS");
  });

  it("a publicação nova no grupo entra no módulo GRUPOS, para o sino respeitar a escolha", () => {
    expect(moduleForNotification("GROUP_NEW_POST")).toBe("GROUPS");
    expect(isNotificationHidden({ kind: "GROUP_NEW_POST" }, new Set(["GROUPS"]))).toBe(true);
    expect(isNotificationHidden({ kind: "GROUP_NEW_POST" }, new Set(["MESSAGES"]))).toBe(false);
  });

  it("study pair notifications belong to STUDY_PAIRS", () => {
    for (const kind of [
      "STUDY_PAIR_MATCHED",
      "STUDY_PAIR_CHECKIN",
      "STUDY_PAIR_ENDED",
      "STUDY_PAIR_REMINDER",
    ]) {
      expect(moduleForNotification(kind)).toBe("STUDY_PAIRS");
      expect(isNotificationHidden({ kind }, new Set(["STUDY_PAIRS"]))).toBe(true);
    }
  });

  it("notificação de área não desativável fica visível", () => {
    expect(moduleForNotification("NEW_COMMENT")).toBeNull();
    expect(moduleForNotification("CONNECTION_REQUEST")).toBeNull();
    expect(isNotificationHidden({ kind: "NEW_COMMENT" }, new Set(["MESSAGES"]))).toBe(false);
  });

  it("esconde só o que pertence a um módulo desativado", () => {
    const disabled = new Set(["MESSAGES", "JOBS"]);
    expect(isNotificationHidden({ kind: "NEW_MESSAGE" }, disabled)).toBe(true);
    expect(isNotificationHidden({ kind: "JOB" }, disabled)).toBe(true);
    expect(isNotificationHidden({ kind: "EVENT" }, disabled)).toBe(false);
  });

  it("hides the real event and job kinds (the old keys never matched them)", () => {
    expect(isNotificationHidden({ kind: "EVENT_NEXT_OCCURRENCE" }, new Set(["EVENTS"]))).toBe(true);
    expect(isNotificationHidden({ kind: "JOB_APPLICATION_STATUS" }, new Set(["JOBS"]))).toBe(true);
  });

  it("keeps community project notices in the disabled project module", () => {
    expect(moduleForNotification("NEW_COMMUNITY_PROJECT")).toBe("COMMUNITY_PROJECTS");
    expect(
      isNotificationHidden({ kind: "NEW_COMMUNITY_PROJECT" }, new Set(["COMMUNITY_PROJECTS"])),
    ).toBe(true);
    expect(isNotificationHidden({ kind: "NEW_COMMUNITY_PROJECT" }, new Set(["JOBS"]))).toBe(false);
  });

  it("trusts the module the backend resolved", () => {
    expect(isNotificationHidden({ kind: "ANYTHING", module: "BLOGS" }, new Set(["BLOGS"]))).toBe(
      true,
    );
    expect(
      isNotificationHidden({ kind: "NEW_MESSAGE", module: "OTHER" }, new Set(["MESSAGES"])),
    ).toBe(false);
  });
});
