export function getOtherParticipantId(
  participantIds: string[],
  currentUserId: string | null | undefined,
): string | undefined {
  return participantIds.find((id) => id !== currentUserId);
}

export function sortByTime<T extends { time: string }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) => new Date(left.time).getTime() - new Date(right.time).getTime(),
  );
}
