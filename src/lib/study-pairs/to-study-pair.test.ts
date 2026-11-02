import type { StudyPairView } from "@/types/application/study-pairs/study-pair-view";
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";

import { isoWeekMonday, studyPairsErrorCode, toStudyPair } from "./to-study-pair";

const checkin = (userId: string, weekKey: string, note: string) => ({
  userId,
  weekKey,
  note,
  createdAt: "2026-10-27T12:00:00Z",
  updatedAt: "2026-10-27T12:00:00Z",
});

const pair = (overrides: Partial<StudyPairView> = {}): StudyPairView => ({
  id: "sp_1",
  goal: "Aprender Rust",
  goalKey: "aprender-rust",
  topic: "TECNOLOGIA",
  startedAt: "2026-10-02T15:00:00Z",
  weekKey: "2026-W44",
  partner: { id: "partner", username: "ada", name: "Ada", avatar: null },
  myCheckinThisWeek: false,
  partnerCheckinThisWeek: true,
  checkins: [],
  ...overrides,
});

describe("isoWeekMonday", () => {
  it("returns the Monday of an ISO week, across year boundaries", () => {
    expect(isoWeekMonday("2026-W44")).toBe("2026-10-26");
    expect(isoWeekMonday("2026-W01")).toBe("2025-12-29");
    expect(isoWeekMonday("2020-W53")).toBe("2020-12-28");
    expect(isoWeekMonday("nope")).toBeNull();
  });
});

describe("toStudyPair", () => {
  it("splits this week into mine and partner, keeping empty notes as check-ins", () => {
    const view = toStudyPair(
      pair({
        myCheckinThisWeek: true,
        checkins: [checkin("me", "2026-W44", ""), checkin("partner", "2026-W44", "Capítulo 4")],
      }),
    );

    expect(view.myCheckin).toBe("");
    expect(view.partnerCheckin).toBe("Capítulo 4");
    expect(view.history).toEqual([]);
    expect(view.partner.href).toBe("/perfil/ada");
    expect(view.topicLabel).not.toBe("TECNOLOGIA");
    expect(view.sinceLabel).toBe("2 de outubro");
  });

  it("marks a missing check-in as null and builds history newest first", () => {
    const view = toStudyPair(
      pair({
        partnerCheckinThisWeek: false,
        checkins: [
          checkin("partner", "2026-W42", "Ownership"),
          checkin("me", "2026-W43", "Traits"),
          checkin("partner", "2026-W43", ""),
        ],
      }),
    );

    expect(view.myCheckin).toBeNull();
    expect(view.partnerCheckin).toBeNull();
    expect(view.history).toEqual([
      { weekKey: "2026-W43", label: "Semana de 19 de out.", myNote: "Traits", partnerNote: "" },
      {
        weekKey: "2026-W42",
        label: "Semana de 12 de out.",
        myNote: null,
        partnerNote: "Ownership",
      },
    ]);
  });
});

describe("studyPairsErrorCode", () => {
  it("keeps the codes the form explains and maps the rest to UNKNOWN", () => {
    expect(studyPairsErrorCode(new ApiError(409, "STUDY_PAIR_LIMIT", "x"))).toBe(
      "STUDY_PAIR_LIMIT",
    );
    expect(studyPairsErrorCode(new ApiError(500, "BOOM", "x"))).toBe("UNKNOWN");
    expect(studyPairsErrorCode(new Error("offline"))).toBe("UNKNOWN");
  });
});
