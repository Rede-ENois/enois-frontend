export function findActiveMention(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const index = before.lastIndexOf("@");
  if (index === -1) return ["", -1] as const;

  const query = before.slice(index + 1);
  if (query.includes(" ") || query.includes("\n") || query.length === 0) {
    return ["", -1] as const;
  }

  return [query, index] as const;
}
