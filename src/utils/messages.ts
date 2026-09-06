export function getOtherParticipantId(
  participantIds: string[],
  currentUserId: string | null | undefined,
): string | undefined {
  return participantIds.find((participantId) => participantId !== currentUserId);
}

export function sortMessagesByTime<T extends { time: string }>(messages: T[]): T[] {
  return [...messages].sort(
    (leftMessage, rightMessage) =>
      new Date(leftMessage.time).getTime() - new Date(rightMessage.time).getTime(),
  );
}
