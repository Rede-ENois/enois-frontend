import { TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { StudyPairView } from "@/types/application/study-pairs/study-pair-view";
import type { StudyPair, StudyPairsErrorCode } from "@rede-enois/design-system/domain";

import { ApiError } from "@/lib/api-client";
import { dataSemAno, formatarData } from "@/lib/date/format";

const DAY_MS = 86_400_000;

/** Codes the request form explains; anything else is `UNKNOWN`. */
const KNOWN_ERRORS = new Set<StudyPairsErrorCode>([
  "STUDY_GOAL_REQUIRED",
  "STUDY_GOAL_TOO_LONG",
  "INVALID_TOPIC",
  "STUDY_PAIRS_ADULTS_ONLY",
  "BIRTH_DATE_REQUIRED",
  "EMAIL_NOT_VERIFIED",
  "ACCOUNT_RESTRICTED",
  "STUDY_REQUEST_ALREADY_OPEN",
  "STUDY_PAIR_LIMIT",
  "STUDY_PAIRS_DISABLED",
]);

export function studyPairsErrorCode(error: unknown): StudyPairsErrorCode {
  const code = error instanceof ApiError ? error.code : undefined;
  return code && KNOWN_ERRORS.has(code as StudyPairsErrorCode)
    ? (code as StudyPairsErrorCode)
    : "UNKNOWN";
}

/** Monday of an ISO week ("2026-W44" -> "2026-10-26"), or null when the key is malformed. */
export function isoWeekMonday(weekKey: string): string | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // January 4th is always in week 1; its Monday starts the ISO year.
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Weekday = new Date(jan4).getUTCDay() || 7;
  const monday = jan4 - (jan4Weekday - 1) * DAY_MS + (week - 1) * 7 * DAY_MS;
  return new Date(monday).toISOString().slice(0, 10);
}

export function topicLabel(topic: string | null): string | null {
  if (!topic) return null;
  return TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? topic;
}

/**
 * API pair -> view model. This week's notes are split into mine and the partner's (`""` = check-in
 * without words, `null` = not yet); earlier weeks with at least one check-in become the history.
 */
export function toStudyPair(pair: StudyPairView): StudyPair {
  const isPartner = (userId: string) => userId === pair.partner.id;
  const thisWeek = pair.checkins.filter((c) => c.weekKey === pair.weekKey);
  const mine = thisWeek.find((c) => !isPartner(c.userId));
  const partners = thisWeek.find((c) => isPartner(c.userId));

  const earlierWeeks = [
    ...new Set(pair.checkins.map((c) => c.weekKey).filter((w) => w !== pair.weekKey)),
  ].sort((a, b) => b.localeCompare(a));

  return {
    id: pair.id,
    goal: pair.goal,
    topicLabel: topicLabel(pair.topic),
    sinceLabel: formatarData(pair.startedAt, { day: "numeric", month: "long" }),
    partner: {
      id: pair.partner.id,
      username: pair.partner.username,
      name: pair.partner.name,
      avatarUrl: pair.partner.avatar,
      href: `/perfil/${pair.partner.username}`,
    },
    myCheckin: mine?.note ?? (pair.myCheckinThisWeek ? "" : null),
    partnerCheckin: partners?.note ?? (pair.partnerCheckinThisWeek ? "" : null),
    history: earlierWeeks.map((weekKey) => {
      const week = pair.checkins.filter((c) => c.weekKey === weekKey);
      const monday = isoWeekMonday(weekKey);
      return {
        weekKey,
        label: monday ? texts.studyPairs.weekLabel(dataSemAno(monday)) : weekKey,
        myNote: week.find((c) => !isPartner(c.userId))?.note ?? null,
        partnerNote: week.find((c) => isPartner(c.userId))?.note ?? null,
      };
    }),
  };
}
