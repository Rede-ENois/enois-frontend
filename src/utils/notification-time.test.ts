import { describe, expect, it } from "vitest";

import { notificationDayLabel } from "./notification-time";

describe("notificationDayLabel", () => {
  const now = new Date(2026, 10, 2, 17, 30);

  it("groups by today, yesterday and then the date", () => {
    expect(notificationDayLabel(new Date(2026, 10, 2, 8).toISOString(), now)).toBe("Hoje");
    expect(notificationDayLabel(new Date(2026, 10, 1, 23).toISOString(), now)).toBe("Ontem");
    expect(notificationDayLabel(new Date(2026, 9, 28, 12).toISOString(), now)).toMatch(/28 de out/);
    expect(notificationDayLabel(new Date(2025, 9, 28, 12).toISOString(), now)).toMatch(/2025/);
  });

  it("leaves a missing or broken date without a group", () => {
    expect(notificationDayLabel(null, now)).toBe("");
    expect(notificationDayLabel("not-a-date", now)).toBe("");
  });
});
