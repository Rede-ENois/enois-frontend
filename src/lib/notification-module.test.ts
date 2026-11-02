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

  it("study pair notifications belong to STUDY_PAIRS", () => {
    for (const kind of [
      "STUDY_PAIR_MATCHED",
      "STUDY_PAIR_CHECKIN",
      "STUDY_PAIR_ENDED",
      "STUDY_PAIR_REMINDER",
    ]) {
      expect(moduleForNotification(kind)).toBe("STUDY_PAIRS");
      expect(isNotificationHidden(kind, new Set(["STUDY_PAIRS"]))).toBe(true);
    }
  });

  it("notificação de área não desativável fica visível", () => {
    expect(moduleForNotification("NEW_COMMENT")).toBeNull();
    expect(moduleForNotification("CONNECTION_REQUEST")).toBeNull();
    expect(isNotificationHidden("NEW_COMMENT", new Set(["MESSAGES"]))).toBe(false);
  });

  it("esconde só o que pertence a um módulo desativado", () => {
    const disabled = new Set(["MESSAGES", "JOBS"]);
    expect(isNotificationHidden("NEW_MESSAGE", disabled)).toBe(true);
    expect(isNotificationHidden("JOB", disabled)).toBe(true);
    expect(isNotificationHidden("EVENT", disabled)).toBe(false);
  });
});
