export type PageResponse<T> = {
  items: T[];
  nextCursor: string | null;
};
