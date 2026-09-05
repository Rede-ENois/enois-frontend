export function parseDelimitedList(value: string, delimiter: string | RegExp): string[] {
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCommaSeparatedList(value: string): string[] {
  return parseDelimitedList(value, ",");
}

export function parseLineSeparatedList(value: string): string[] {
  return parseDelimitedList(value, /\r?\n/);
}

export function mapValidationErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  return Object.fromEntries(
    issues
      .filter((issue) => issue.path.length > 0)
      .map((issue) => [String(issue.path[0]), issue.message]),
  );
}
