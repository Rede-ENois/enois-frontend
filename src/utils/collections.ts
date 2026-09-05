export function prependIfMissing<T>(
  items: T[],
  item: T | null | undefined,
  exists: (current: T) => boolean,
): T[] {
  return item && !items.some(exists) ? [item, ...items] : items;
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function mergePage<T>(current: T[], page: T[], firstPage: boolean): T[] {
  if (page.length === 0) return current;
  return firstPage ? page : [...current, ...page];
}

export function mergeUniquePage<T>(
  current: T[],
  page: T[],
  firstPage: boolean,
  getKey: (item: T) => PropertyKey,
): T[] {
  if (firstPage) return page;
  if (page.length === 0) return current;

  const existing = new Set(current.map(getKey));
  const newItems = page.filter((item) => !existing.has(getKey(item)));
  return newItems.length > 0 ? [...current, ...newItems] : current;
}
