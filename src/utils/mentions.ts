import type { MentionContext } from "@/types/components/mention-textarea/mention-context";

export const emptyMentionContext: MentionContext = {
  query: "",
  index: -1,
};

export function getMentionContext(text: string, cursor: number): MentionContext {
  const beforeCursor = text.slice(0, cursor);
  const index = beforeCursor.lastIndexOf("@");
  if (index === -1) return emptyMentionContext;

  const query = beforeCursor.slice(index + 1);
  const invalidQuery = query.length === 0 || /\s/.test(query);

  return invalidQuery ? emptyMentionContext : { query, index };
}

export function insertMention(
  text: string,
  context: MentionContext,
  username: string,
): { value: string; cursor: number } {
  const before = text.slice(0, context.index);
  const after = text.slice(context.index + context.query.length + 1);
  const value = `${before}@${username} ${after}`;

  return {
    value,
    cursor: before.length + username.length + 2,
  };
}

export function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

export function moveCircularIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (index + delta + length) % length;
}
